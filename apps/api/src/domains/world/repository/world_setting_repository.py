"""Repository for WorldSetting entity."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.world.models.world_models import WorldSetting, WorldSettingType


class WorldSettingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self, novel_id: uuid.UUID, world_setting_id: uuid.UUID
    ) -> WorldSetting | None:
        result = await self.session.execute(
            select(WorldSetting).where(
                WorldSetting.id == world_setting_id,
                WorldSetting.novel_id == novel_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_novel(
        self,
        novel_id: uuid.UUID,
        name: str | None = None,
        type: WorldSettingType | None = None,
    ) -> list[WorldSetting]:
        stmt = select(WorldSetting).where(WorldSetting.novel_id == novel_id)
        if name:
            stmt = stmt.where(WorldSetting.name.ilike(f"%{name}%"))
        if type is not None:
            stmt = stmt.where(WorldSetting.type == type)
        stmt = stmt.order_by(WorldSetting.created_at.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, novel_id: uuid.UUID, **fields: object) -> WorldSetting:
        world_setting = WorldSetting(novel_id=novel_id, **fields)
        self.session.add(world_setting)
        await self.session.flush()
        await self.session.refresh(world_setting)
        return world_setting

    async def update(
        self, world_setting: WorldSetting, **fields: object
    ) -> WorldSetting:
        for k, v in fields.items():
            setattr(world_setting, k, v)
        await self.session.flush()
        await self.session.refresh(world_setting)
        return world_setting

    async def delete(self, world_setting: WorldSetting) -> None:
        await self.session.delete(world_setting)
        await self.session.flush()
