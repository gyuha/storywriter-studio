"""Repository for Timeline entity."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.world.models.world_models import Timeline


class TimelineRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self, novel_id: uuid.UUID, timeline_id: uuid.UUID
    ) -> Timeline | None:
        result = await self.session.execute(
            select(Timeline).where(
                Timeline.id == timeline_id, Timeline.novel_id == novel_id
            )
        )
        return result.scalar_one_or_none()

    async def list_by_novel(self, novel_id: uuid.UUID) -> list[Timeline]:
        stmt = (
            select(Timeline)
            .where(Timeline.novel_id == novel_id)
            .order_by(Timeline.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, novel_id: uuid.UUID, **fields: object) -> Timeline:
        timeline = Timeline(novel_id=novel_id, **fields)
        self.session.add(timeline)
        await self.session.flush()
        await self.session.refresh(timeline)
        return timeline

    async def update(self, timeline: Timeline, **fields: object) -> Timeline:
        for k, v in fields.items():
            setattr(timeline, k, v)
        await self.session.flush()
        await self.session.refresh(timeline)
        return timeline

    async def delete(self, timeline: Timeline) -> None:
        await self.session.delete(timeline)
        await self.session.flush()
