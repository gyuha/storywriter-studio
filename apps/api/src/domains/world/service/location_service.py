"""Location application service."""

from __future__ import annotations

import uuid

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.models.world_models import Location
from domains.world.repository.location_repository import LocationRepository
from domains.world.schemas.world_schemas import LocationCreate, LocationUpdate


class LocationService:
    def __init__(
        self,
        novel_repo: NovelRepository,
        location_repo: LocationRepository,
    ) -> None:
        self.novel_repo = novel_repo
        self.location_repo = location_repo

    async def _verify_novel_ownership(
        self, novel_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        novel = await self.novel_repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()

    async def list_locations(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        name: str | None = None,
    ) -> list[Location]:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.location_repo.list_by_novel(novel_id, name=name)

    async def get_location(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        location_id: uuid.UUID,
    ) -> Location:
        await self._verify_novel_ownership(novel_id, user_id)
        location = await self.location_repo.get_by_id(novel_id, location_id)
        if location is None:
            raise NotFoundError("Location")
        return location

    async def create_location(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        data: LocationCreate,
    ) -> Location:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.location_repo.create(
            novel_id, **data.model_dump(exclude_none=True)
        )

    async def update_location(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        location_id: uuid.UUID,
        data: LocationUpdate,
    ) -> Location:
        location = await self.get_location(novel_id, user_id, location_id)
        return await self.location_repo.update(
            location, **data.model_dump(exclude_unset=True)
        )

    async def delete_location(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        location_id: uuid.UUID,
    ) -> None:
        location = await self.get_location(novel_id, user_id, location_id)
        await self.location_repo.delete(location)
