"""Repository for Novel aggregate root."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.novel.models.novel_models import Chapter, Novel


class NovelRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, novel_id: uuid.UUID) -> Novel | None:
        result = await self.session.execute(select(Novel).where(Novel.id == novel_id))
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> tuple[list[tuple[Novel, int]], int]:
        chapter_count_subq = (
            select(func.count(Chapter.id))
            .where(Chapter.novel_id == Novel.id)
            .correlate(Novel)
            .scalar_subquery()
        )
        stmt = (
            select(Novel, chapter_count_subq.label("chapter_count"))
            .where(Novel.user_id == user_id)
            .order_by(Novel.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = (await self.session.execute(stmt)).all()

        count_stmt = select(func.count()).select_from(Novel).where(Novel.user_id == user_id)
        total = (await self.session.scalar(count_stmt)) or 0

        return [(row[0], row[1]) for row in rows], total

    async def create(self, user_id: uuid.UUID, **fields: object) -> Novel:
        novel = Novel(user_id=user_id, **fields)
        self.session.add(novel)
        await self.session.flush()
        await self.session.refresh(novel)
        return novel

    async def update(self, novel: Novel, **fields: object) -> Novel:
        for k, v in fields.items():
            setattr(novel, k, v)
        await self.session.flush()
        await self.session.refresh(novel)
        return novel

    async def delete(self, novel: Novel) -> None:
        await self.session.delete(novel)
        await self.session.flush()
