"""WorldSetting HTTP router."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.models.world_models import WorldSettingType
from domains.world.repository.world_setting_repository import WorldSettingRepository
from domains.world.schemas.world_schemas import (
    WorldSettingCreate,
    WorldSettingResponse,
    WorldSettingUpdate,
)
from domains.world.service.world_setting_service import WorldSettingService

router = APIRouter(tags=["world-settings"])


async def _get_world_setting_service(
    session: AsyncSession = Depends(get_async_session),
) -> WorldSettingService:
    return WorldSettingService(NovelRepository(session), WorldSettingRepository(session))


def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.post(
    "/world-settings",
    response_model=WorldSettingResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_world_setting(
    novel_id: uuid.UUID,
    data: WorldSettingCreate,
    current_user: User = Depends(get_current_user),
    service: WorldSettingService = Depends(_get_world_setting_service),
) -> WorldSettingResponse:
    try:
        return await service.create_world_setting(novel_id, current_user.id, data)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/world-settings", response_model=list[WorldSettingResponse])
async def list_world_settings(
    novel_id: uuid.UUID,
    name: str | None = Query(None),
    type: WorldSettingType | None = Query(None),
    current_user: User = Depends(get_current_user),
    service: WorldSettingService = Depends(_get_world_setting_service),
) -> list[WorldSettingResponse]:
    try:
        return await service.list_world_settings(  # type: ignore[return-value]
            novel_id, current_user.id, name=name, type=type
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get(
    "/world-settings/{world_setting_id}", response_model=WorldSettingResponse
)
async def get_world_setting(
    novel_id: uuid.UUID,
    world_setting_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: WorldSettingService = Depends(_get_world_setting_service),
) -> WorldSettingResponse:
    try:
        return await service.get_world_setting(  # type: ignore[return-value]
            novel_id, current_user.id, world_setting_id
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.put(
    "/world-settings/{world_setting_id}", response_model=WorldSettingResponse
)
async def update_world_setting(
    novel_id: uuid.UUID,
    world_setting_id: uuid.UUID,
    data: WorldSettingUpdate,
    current_user: User = Depends(get_current_user),
    service: WorldSettingService = Depends(_get_world_setting_service),
) -> WorldSettingResponse:
    try:
        return await service.update_world_setting(  # type: ignore[return-value]
            novel_id, current_user.id, world_setting_id, data
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.delete(
    "/world-settings/{world_setting_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_world_setting(
    novel_id: uuid.UUID,
    world_setting_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: WorldSettingService = Depends(_get_world_setting_service),
) -> None:
    try:
        await service.delete_world_setting(novel_id, current_user.id, world_setting_id)
    except AppError as e:
        raise _app_error_to_http(e) from e
