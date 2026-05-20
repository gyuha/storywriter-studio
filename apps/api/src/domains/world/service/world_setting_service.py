"""WorldSetting application service."""

from __future__ import annotations

import uuid

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.models.world_models import WorldSetting, WorldSettingType
from domains.world.repository.world_setting_repository import WorldSettingRepository
from domains.world.schemas.world_schemas import WorldSettingCreate, WorldSettingUpdate


class WorldSettingService:
    def __init__(
        self,
        novel_repo: NovelRepository,
        world_setting_repo: WorldSettingRepository,
    ) -> None:
        self.novel_repo = novel_repo
        self.world_setting_repo = world_setting_repo

    async def _verify_novel_ownership(
        self, novel_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        novel = await self.novel_repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()

    async def list_world_settings(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        name: str | None = None,
        type: WorldSettingType | None = None,
    ) -> list[WorldSetting]:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.world_setting_repo.list_by_novel(
            novel_id, name=name, type=type
        )

    async def get_world_setting(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        world_setting_id: uuid.UUID,
    ) -> WorldSetting:
        await self._verify_novel_ownership(novel_id, user_id)
        world_setting = await self.world_setting_repo.get_by_id(
            novel_id, world_setting_id
        )
        if world_setting is None:
            raise NotFoundError("WorldSetting")
        return world_setting

    async def create_world_setting(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        data: WorldSettingCreate,
    ) -> WorldSetting:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.world_setting_repo.create(
            novel_id, **data.model_dump(exclude_none=True)
        )

    async def update_world_setting(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        world_setting_id: uuid.UUID,
        data: WorldSettingUpdate,
    ) -> WorldSetting:
        world_setting = await self.get_world_setting(novel_id, user_id, world_setting_id)
        return await self.world_setting_repo.update(
            world_setting, **data.model_dump(exclude_unset=True)
        )

    async def delete_world_setting(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        world_setting_id: uuid.UUID,
    ) -> None:
        world_setting = await self.get_world_setting(novel_id, user_id, world_setting_id)
        await self.world_setting_repo.delete(world_setting)
