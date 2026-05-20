"""Repository for Location entity."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.world.models.world_models import Location


class LocationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self, novel_id: uuid.UUID, location_id: uuid.UUID
    ) -> Location | None:
        result = await self.session.execute(
            select(Location).where(
                Location.id == location_id, Location.novel_id == novel_id
            )
        )
        return result.scalar_one_or_none()

    async def list_by_novel(
        self, novel_id: uuid.UUID, name: str | None = None
    ) -> list[Location]:
        stmt = select(Location).where(Location.novel_id == novel_id)
        if name:
            stmt = stmt.where(Location.name.ilike(f"%{name}%"))
        stmt = stmt.order_by(Location.created_at.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, novel_id: uuid.UUID, **fields: object) -> Location:
        location = Location(novel_id=novel_id, **fields)
        self.session.add(location)
        await self.session.flush()
        await self.session.refresh(location)
        return location

    async def update(self, location: Location, **fields: object) -> Location:
        for k, v in fields.items():
            setattr(location, k, v)
        await self.session.flush()
        await self.session.refresh(location)
        return location

    async def delete(self, location: Location) -> None:
        await self.session.delete(location)
        await self.session.flush()
