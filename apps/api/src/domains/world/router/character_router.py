"""Character HTTP router."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.repository.character_repository import CharacterRepository
from domains.world.schemas.world_schemas import (
    CharacterCreate,
    CharacterResponse,
    CharacterUpdate,
)
from domains.world.service.character_service import CharacterService

router = APIRouter(tags=["characters"])


async def _get_character_service(
    session: AsyncSession = Depends(get_async_session),
) -> CharacterService:
    return CharacterService(NovelRepository(session), CharacterRepository(session))


def _app_error_to_http(error: AppError) -> HTTPException:
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.post(
    "/characters",
    response_model=CharacterResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_character(
    novel_id: uuid.UUID,
    data: CharacterCreate,
    current_user: User = Depends(get_current_user),
    service: CharacterService = Depends(_get_character_service),
) -> CharacterResponse:
    try:
        return await service.create_character(novel_id, current_user.id, data)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/characters", response_model=list[CharacterResponse])
async def list_characters(
    novel_id: uuid.UUID,
    name: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    service: CharacterService = Depends(_get_character_service),
) -> list[CharacterResponse]:
    try:
        return await service.list_characters(novel_id, current_user.id, name=name)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get("/characters/{character_id}", response_model=CharacterResponse)
async def get_character(
    novel_id: uuid.UUID,
    character_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CharacterService = Depends(_get_character_service),
) -> CharacterResponse:
    try:
        return await service.get_character(novel_id, current_user.id, character_id)  # type: ignore[return-value]
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.put("/characters/{character_id}", response_model=CharacterResponse)
async def update_character(
    novel_id: uuid.UUID,
    character_id: uuid.UUID,
    data: CharacterUpdate,
    current_user: User = Depends(get_current_user),
    service: CharacterService = Depends(_get_character_service),
) -> CharacterResponse:
    try:
        return await service.update_character(  # type: ignore[return-value]
            novel_id, current_user.id, character_id, data
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.delete(
    "/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_character(
    novel_id: uuid.UUID,
    character_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: CharacterService = Depends(_get_character_service),
) -> None:
    try:
        await service.delete_character(novel_id, current_user.id, character_id)
    except AppError as e:
        raise _app_error_to_http(e) from e
