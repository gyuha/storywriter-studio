"""Location HTTP router."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.repository.location_repository import LocationRepository
from domains.world.schemas.world_schemas import (
    LocationCreate,
    LocationResponse,
    LocationUpdate,
)
from domains.world.service.location_service import LocationService

router = APIRouter(tags=["locations"])


async def _get_location_service(
    session: AsyncSession = Depends(get_async_session),
) -> LocationService:
    return LocationService(NovelRepository(session), LocationRepository(session))


def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.post(
    "/locations",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_location(
    novel_id: uuid.UUID,
    data: LocationCreate,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(_get_location_service),
) -> LocationResponse:
    try:
        return await service.create_location(novel_id, current_user.id, data)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/locations", response_model=list[LocationResponse])
async def list_locations(
    novel_id: uuid.UUID,
    name: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(_get_location_service),
) -> list[LocationResponse]:
    try:
        return await service.list_locations(novel_id, current_user.id, name=name)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/locations/{location_id}", response_model=LocationResponse)
async def get_location(
    novel_id: uuid.UUID,
    location_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(_get_location_service),
) -> LocationResponse:
    try:
        return await service.get_location(novel_id, current_user.id, location_id)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.put("/locations/{location_id}", response_model=LocationResponse)
async def update_location(
    novel_id: uuid.UUID,
    location_id: uuid.UUID,
    data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(_get_location_service),
) -> LocationResponse:
    try:
        return await service.update_location(  # type: ignore[return-value]
            novel_id, current_user.id, location_id, data
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    novel_id: uuid.UUID,
    location_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: LocationService = Depends(_get_location_service),
) -> None:
    try:
        await service.delete_location(novel_id, current_user.id, location_id)
    except AppError as e:
        raise _app_error_to_http(e) from e
