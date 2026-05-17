"""Repository for Chapter entity."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.novel.models.novel_models import Chapter


class ChapterRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, novel_id: uuid.UUID, chapter_id: uuid.UUID) -> Chapter | None:
        result = await self.session.execute(
            select(Chapter).where(Chapter.id == chapter_id, Chapter.novel_id == novel_id)
        )
        return result.scalar_one_or_none()

    async def list_by_novel(self, novel_id: uuid.UUID) -> list[Chapter]:
        result = await self.session.execute(
            select(Chapter)
            .where(Chapter.novel_id == novel_id)
            .order_by(Chapter.order_key.asc())
        )
        return list(result.scalars().all())

    async def create(self, novel_id: uuid.UUID, **fields: object) -> Chapter:
        chapter = Chapter(novel_id=novel_id, **fields)
        self.session.add(chapter)
        await self.session.flush()
        await self.session.refresh(chapter)
        return chapter

    async def update(self, chapter: Chapter, **fields: object) -> Chapter:
        for k, v in fields.items():
            setattr(chapter, k, v)
        await self.session.flush()
        await self.session.refresh(chapter)
        return chapter

    async def delete(self, chapter: Chapter) -> None:
        await self.session.delete(chapter)
        await self.session.flush()

    async def get_last_chapter(self, novel_id: uuid.UUID) -> Chapter | None:
        result = await self.session.execute(
            select(Chapter)
            .where(Chapter.novel_id == novel_id)
            .order_by(Chapter.order_key.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
