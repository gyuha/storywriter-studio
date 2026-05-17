"""Novel domain HTTP router.

Routes
------
POST   /novels                              Create novel
GET    /novels                              List novels (paginated)
GET    /novels/{novel_id}                   Get novel
PUT    /novels/{novel_id}                   Update novel
DELETE /novels/{novel_id}                   Delete novel

POST   /novels/{novel_id}/chapters          Create chapter
GET    /novels/{novel_id}/chapters          List chapters
GET    /novels/{novel_id}/chapters/{id}     Get chapter
PUT    /novels/{novel_id}/chapters/{id}     Update chapter
PATCH  /novels/{novel_id}/chapters/{id}/reorder  Reorder chapter
DELETE /novels/{novel_id}/chapters/{id}     Delete chapter
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
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

router = APIRouter(prefix="/novels", tags=["novels"])


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
