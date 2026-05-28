"""Novel domain HTTP router.

Routes
------
POST   /novels                              Create novel
GET    /novels                              List novels (paginated)
GET    /novels/{novel_id}                   Get novel
PUT    /novels/{novel_id}                   Update novel
DELETE /novels/{novel_id}                   Delete novel
GET    /novels/{novel_id}/export            Export novel as TXT or ZIP

POST   /novels/{novel_id}/chapters          Create chapter
GET    /novels/{novel_id}/chapters          List chapters
GET    /novels/{novel_id}/chapters/{id}     Get chapter
PUT    /novels/{novel_id}/chapters/{id}     Update chapter
PATCH  /novels/{novel_id}/chapters/{id}/reorder  Reorder chapter
DELETE /novels/{novel_id}/chapters/{id}     Delete chapter
"""

from __future__ import annotations

import io
import re
import uuid
import zipfile
from typing import Literal
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.repository.chapter_repository import ChapterRepository
from domains.novel.repository.novel_repository import NovelRepository
from domains.novel.schemas.novel_schemas import (
    ChapterCreate,
    ChapterReorderRequest,
    ChapterResponse,
    ChapterUpdate,
    NovelCreate,
    NovelListResponse,
    NovelResponse,
    NovelUpdate,
)
from domains.novel.service.chapter_service import ChapterService
from domains.novel.service.novel_service import NovelService

from domains.novel.router.draft_router import _extract_text, router as draft_router
from domains.novel.router.story_beat_router import router as story_beat_router

router = APIRouter(prefix="/novels", tags=["novels"])
router.include_router(draft_router)
router.include_router(story_beat_router)


# ---------------------------------------------------------------------------
# Dependency helpers
# ---------------------------------------------------------------------------


async def _get_novel_service(
    session: AsyncSession = Depends(get_async_session),
) -> NovelService:
    return NovelService(NovelRepository(session))


async def _get_chapter_service(
    session: AsyncSession = Depends(get_async_session),
) -> ChapterService:
    return ChapterService(NovelRepository(session), ChapterRepository(session))


def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


# ---------------------------------------------------------------------------
# Novel endpoints
# ---------------------------------------------------------------------------


@router.post("", response_model=NovelResponse, status_code=status.HTTP_201_CREATED)
async def create_novel(
    data: NovelCreate,
    current_user: User = Depends(get_current_user),
    service: NovelService = Depends(_get_novel_service),
) -> NovelResponse:
    try:
        novel = await service.create_novel(current_user.id, data)
        return NovelResponse(
            id=novel.id,
            user_id=novel.user_id,
            title=novel.title,
            genre=novel.genre,
            description=novel.description,
            cover_image_url=novel.cover_image_url,
            tagline=novel.tagline,
            tags=novel.tags,
            created_at=novel.created_at,
            updated_at=novel.updated_at,
            chapter_count=0,
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("", response_model=NovelListResponse)
async def list_novels(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    service: NovelService = Depends(_get_novel_service),
) -> NovelListResponse:
    try:
        items, total = await service.list_novels(current_user.id, offset, limit)
        return NovelListResponse(items=items, total=total)
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/{novel_id}", response_model=NovelResponse)
async def get_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: NovelService = Depends(_get_novel_service),
) -> NovelResponse:
    try:
        novel = await service.get_novel(novel_id, current_user.id)
        return NovelResponse(
            id=novel.id,
            user_id=novel.user_id,
            title=novel.title,
            genre=novel.genre,
            description=novel.description,
            cover_image_url=novel.cover_image_url,
            tagline=novel.tagline,
            tags=novel.tags,
            created_at=novel.created_at,
            updated_at=novel.updated_at,
            chapter_count=0,
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.put("/{novel_id}", response_model=NovelResponse)
async def update_novel(
    novel_id: uuid.UUID,
    data: NovelUpdate,
    current_user: User = Depends(get_current_user),
    service: NovelService = Depends(_get_novel_service),
) -> NovelResponse:
    try:
        novel = await service.update_novel(novel_id, current_user.id, data)
        return NovelResponse(
            id=novel.id,
            user_id=novel.user_id,
            title=novel.title,
            genre=novel.genre,
            description=novel.description,
            cover_image_url=novel.cover_image_url,
            tagline=novel.tagline,
            tags=novel.tags,
            created_at=novel.created_at,
            updated_at=novel.updated_at,
            chapter_count=0,
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.delete("/{novel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_novel(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: NovelService = Depends(_get_novel_service),
) -> None:
    try:
        await service.delete_novel(novel_id, current_user.id)
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/{novel_id}/stats")
async def get_novel_stats(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> dict:
    chapter_svc = ChapterService(NovelRepository(session), ChapterRepository(session))
    try:
        chapters = await chapter_svc.list_chapters(novel_id, current_user.id)
    except AppError as e:
        raise _app_error_to_http(e) from e

    chapter_stats = [
        {
            "id": str(ch.id),
            "title": ch.title,
            "char_count": len(_extract_text(ch.content)) if ch.content else 0,
            "updated_at": ch.updated_at.isoformat() if ch.updated_at else None,
        }
        for ch in chapters
    ]
    return {
        "total_chars": sum(c["char_count"] for c in chapter_stats),
        "chapter_count": len(chapters),
        "chapters": chapter_stats,
    }


@router.get("/{novel_id}/export")
async def export_novel(
    novel_id: uuid.UUID,
    scope: Literal["full", "zip"] = Query(default="full"),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> StreamingResponse:
    novel_svc = NovelService(NovelRepository(session))
    chapter_svc = ChapterService(NovelRepository(session), ChapterRepository(session))
    try:
        novel = await novel_svc.get_novel(novel_id, current_user.id)
        chapters = await chapter_svc.list_chapters(novel_id, current_user.id)
    except AppError as e:
        raise _app_error_to_http(e) from e

    safe_novel_title = re.sub(r'[\\/:*?"<>|]', "_", novel.title)

    if scope == "full":
        lines: list[str] = [novel.title, ""]
        for i, ch in enumerate(chapters, 1):
            lines.append(f"== 제 {i}화: {ch.title} ==")
            lines.append("")
            if ch.content:
                lines.append(_extract_text(ch.content))
            lines.append("")
        text = "\n".join(lines)
        filename = quote(f"{safe_novel_title}.txt")
        return StreamingResponse(
            iter([text.encode("utf-8")]),
            media_type="text/plain; charset=utf-8",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
        )

    # zip: one file per chapter
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for i, ch in enumerate(chapters, 1):
            content = _extract_text(ch.content) if ch.content else ""
            safe_ch_title = re.sub(r'[\\/:*?"<>|]', "_", ch.title)
            zf.writestr(f"{i:03d}_{safe_ch_title}.txt", content.encode("utf-8"))
    buf.seek(0)
    filename = quote(f"{safe_novel_title}_chapters.zip")
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{filename}"},
    )


# ---------------------------------------------------------------------------
# Chapter endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/{novel_id}/chapters",
    response_model=ChapterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_chapter(
    novel_id: uuid.UUID,
    data: ChapterCreate,
    current_user: User = Depends(get_current_user),
    service: ChapterService = Depends(_get_chapter_service),
) -> ChapterResponse:
    try:
        return await service.create_chapter(novel_id, current_user.id, data)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/{novel_id}/chapters", response_model=list[ChapterResponse])
async def list_chapters(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ChapterService = Depends(_get_chapter_service),
) -> list[ChapterResponse]:
    try:
        return await service.list_chapters(novel_id, current_user.id)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/{novel_id}/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(
    novel_id: uuid.UUID,
    chapter_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ChapterService = Depends(_get_chapter_service),
) -> ChapterResponse:
    try:
        return await service.get_chapter(novel_id, chapter_id, current_user.id)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.put("/{novel_id}/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    novel_id: uuid.UUID,
    chapter_id: uuid.UUID,
    data: ChapterUpdate,
    current_user: User = Depends(get_current_user),
    service: ChapterService = Depends(_get_chapter_service),
) -> ChapterResponse:
    try:
        return await service.update_chapter(novel_id, chapter_id, current_user.id, data)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.patch(
    "/{novel_id}/chapters/{chapter_id}/reorder", response_model=ChapterResponse
)
async def reorder_chapter(
    novel_id: uuid.UUID,
    chapter_id: uuid.UUID,
    data: ChapterReorderRequest,
    current_user: User = Depends(get_current_user),
    service: ChapterService = Depends(_get_chapter_service),
) -> ChapterResponse:
    try:
        return await service.reorder_chapter(  # type: ignore[return-value]
            novel_id, chapter_id, current_user.id, data.order_key
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.delete("/{novel_id}/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    novel_id: uuid.UUID,
    chapter_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: ChapterService = Depends(_get_chapter_service),
) -> None:
    try:
        await service.delete_chapter(novel_id, chapter_id, current_user.id)
    except AppError as e:
        raise _app_error_to_http(e) from e
