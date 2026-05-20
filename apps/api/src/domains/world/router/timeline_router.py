"""Timeline HTTP router."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.repository.timeline_repository import TimelineRepository
from domains.world.schemas.world_schemas import (
    TimelineCreate,
    TimelineResponse,
    TimelineUpdate,
)
from domains.world.service.timeline_service import TimelineService

router = APIRouter(tags=["timelines"])


async def _get_timeline_service(
    session: AsyncSession = Depends(get_async_session),
) -> TimelineService:
    return TimelineService(NovelRepository(session), TimelineRepository(session))


def _app_error_to_http(error: AppError) -> Exception:
    from fastapi import HTTPException
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.post(
    "/timelines",
    response_model=TimelineResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_timeline(
    novel_id: uuid.UUID,
    data: TimelineCreate,
    current_user: User = Depends(get_current_user),
    service: TimelineService = Depends(_get_timeline_service),
) -> TimelineResponse:
    try:
        return await service.create_timeline(novel_id, current_user.id, data)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/timelines", response_model=list[TimelineResponse])
async def list_timelines(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: TimelineService = Depends(_get_timeline_service),
) -> list[TimelineResponse]:
    try:
        return await service.list_timelines(novel_id, current_user.id)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/timelines/{timeline_id}", response_model=TimelineResponse)
async def get_timeline(
    novel_id: uuid.UUID,
    timeline_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: TimelineService = Depends(_get_timeline_service),
) -> TimelineResponse:
    try:
        return await service.get_timeline(novel_id, current_user.id, timeline_id)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.put("/timelines/{timeline_id}", response_model=TimelineResponse)
async def update_timeline(
    novel_id: uuid.UUID,
    timeline_id: uuid.UUID,
    data: TimelineUpdate,
    current_user: User = Depends(get_current_user),
    service: TimelineService = Depends(_get_timeline_service),
) -> TimelineResponse:
    try:
        return await service.update_timeline(novel_id, current_user.id, timeline_id, data)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.delete("/timelines/{timeline_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timeline(
    novel_id: uuid.UUID,
    timeline_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: TimelineService = Depends(_get_timeline_service),
) -> None:
    try:
        await service.delete_timeline(novel_id, current_user.id, timeline_id)
    except AppError as e:
        raise _app_error_to_http(e) from e
