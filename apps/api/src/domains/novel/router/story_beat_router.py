"""Story beat HTTP router — plot structure management."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError, NotFoundError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.models.novel_models import StoryBeat, StoryBeatType
from domains.novel.repository.novel_repository import NovelRepository

router = APIRouter(tags=["story-beats"])

BeatType = Literal["setup", "rising", "climax", "falling", "resolution", "other"]


class StoryBeatCreate(BaseModel):
    title: str
    content: str | None = None
    beat_type: BeatType = "other"
    order_key: float = 1.0
    chapter_id: uuid.UUID | None = None


class StoryBeatUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    beat_type: BeatType | None = None
    order_key: float | None = None
    chapter_id: uuid.UUID | None = None


class StoryBeatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    novel_id: uuid.UUID
    chapter_id: uuid.UUID | None
    title: str
    content: str | None
    beat_type: str
    order_key: float
    created_at: datetime
    updated_at: datetime


async def _verify_novel_owner(
    novel_id: uuid.UUID,
    user: User,
    session: AsyncSession,
) -> None:
    novel_repo = NovelRepository(session)
    novel = await novel_repo.get_by_id(novel_id)
    if not novel or novel.user_id != user.id:
        raise NotFoundError("소설을 찾을 수 없습니다")


def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.post(
    "/{novel_id}/story-beats",
    response_model=StoryBeatResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_beat(
    novel_id: uuid.UUID,
    data: StoryBeatCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> StoryBeatResponse:
    try:
        await _verify_novel_owner(novel_id, current_user, session)
    except AppError as e:
        raise _app_error_to_http(e) from e

    beat = StoryBeat(
        novel_id=novel_id,
        title=data.title,
        content=data.content,
        beat_type=StoryBeatType(data.beat_type),
        order_key=data.order_key,
        chapter_id=data.chapter_id,
    )
    session.add(beat)
    await session.flush()
    await session.refresh(beat)
    return StoryBeatResponse.model_validate(beat)


@router.get("/{novel_id}/story-beats", response_model=list[StoryBeatResponse])
async def list_beats(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> list[StoryBeatResponse]:
    try:
        await _verify_novel_owner(novel_id, current_user, session)
    except AppError as e:
        raise _app_error_to_http(e) from e

    result = await session.execute(
        select(StoryBeat)
        .where(StoryBeat.novel_id == novel_id)
        .order_by(StoryBeat.order_key.asc())
    )
    return [StoryBeatResponse.model_validate(b) for b in result.scalars().all()]


@router.put("/{novel_id}/story-beats/{beat_id}", response_model=StoryBeatResponse)
async def update_beat(
    novel_id: uuid.UUID,
    beat_id: uuid.UUID,
    data: StoryBeatUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> StoryBeatResponse:
    try:
        await _verify_novel_owner(novel_id, current_user, session)
    except AppError as e:
        raise _app_error_to_http(e) from e

    result = await session.execute(
        select(StoryBeat).where(StoryBeat.id == beat_id, StoryBeat.novel_id == novel_id)
    )
    beat = result.scalar_one_or_none()
    if not beat:
        raise HTTPException(status_code=404, detail="스토리 비트를 찾을 수 없습니다")

    if data.title is not None:
        beat.title = data.title
    if data.content is not None:
        beat.content = data.content
    if data.beat_type is not None:
        beat.beat_type = StoryBeatType(data.beat_type)
    if data.order_key is not None:
        beat.order_key = data.order_key
    if data.chapter_id is not None:
        beat.chapter_id = data.chapter_id

    await session.flush()
    await session.refresh(beat)
    return StoryBeatResponse.model_validate(beat)


@router.delete("/{novel_id}/story-beats/{beat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_beat(
    novel_id: uuid.UUID,
    beat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> None:
    try:
        await _verify_novel_owner(novel_id, current_user, session)
    except AppError as e:
        raise _app_error_to_http(e) from e

    result = await session.execute(
        select(StoryBeat).where(StoryBeat.id == beat_id, StoryBeat.novel_id == novel_id)
    )
    beat = result.scalar_one_or_none()
    if not beat:
        raise HTTPException(status_code=404, detail="스토리 비트를 찾을 수 없습니다")

    await session.delete(beat)
    await session.flush()
