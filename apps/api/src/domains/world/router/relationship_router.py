"""CharacterRelationship HTTP router."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.repository.character_repository import CharacterRepository
from domains.world.repository.relationship_repository import RelationshipRepository
from domains.world.schemas.world_schemas import (
    RelationshipCreate,
    RelationshipResponse,
    RelationshipUpdate,
)
from domains.world.service.relationship_service import RelationshipService

router = APIRouter(tags=["relationships"])


async def _get_relationship_service(
    session: AsyncSession = Depends(get_async_session),
) -> RelationshipService:
    return RelationshipService(
        NovelRepository(session),
        CharacterRepository(session),
        RelationshipRepository(session),
    )


def _app_error_to_http(error: AppError) -> Exception:
    from fastapi import HTTPException
    return HTTPException(status_code=error.status_code, detail=error.message)


@router.post(
    "/characters/{character_id}/relationships",
    response_model=RelationshipResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_relationship(
    novel_id: uuid.UUID,
    character_id: uuid.UUID,
    data: RelationshipCreate,
    current_user: User = Depends(get_current_user),
    service: RelationshipService = Depends(_get_relationship_service),
) -> RelationshipResponse:
    try:
        return await service.create_relationship(novel_id, current_user.id, character_id, data)
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.get(
    "/characters/{character_id}/relationships",
    response_model=list[RelationshipResponse],
)
async def list_relationships(
    novel_id: uuid.UUID,
    character_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: RelationshipService = Depends(_get_relationship_service),
) -> list[RelationshipResponse]:
    try:
        return await service.list_relationships(novel_id, current_user.id, character_id)
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.put(
    "/characters/{character_id}/relationships/{rel_id}",
    response_model=RelationshipResponse,
)
async def update_relationship(
    novel_id: uuid.UUID,
    character_id: uuid.UUID,
    rel_id: uuid.UUID,
    data: RelationshipUpdate,
    current_user: User = Depends(get_current_user),
    service: RelationshipService = Depends(_get_relationship_service),
) -> RelationshipResponse:
    try:
        return await service.update_relationship(
            novel_id, current_user.id, rel_id, character_id, data
        )
    except AppError as e:
        raise _app_error_to_http(e) from e


@router.delete(
    "/characters/{character_id}/relationships/{rel_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_relationship(
    novel_id: uuid.UUID,
    character_id: uuid.UUID,
    rel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    service: RelationshipService = Depends(_get_relationship_service),
) -> None:
    try:
        await service.delete_relationship(novel_id, current_user.id, rel_id)
    except AppError as e:
        raise _app_error_to_http(e) from e
