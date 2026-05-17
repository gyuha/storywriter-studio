"""Chapter application service."""

from __future__ import annotations

import uuid

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.models.novel_models import Chapter
from domains.novel.repository.chapter_repository import ChapterRepository
from domains.novel.repository.novel_repository import NovelRepository
from domains.novel.schemas.novel_schemas import ChapterCreate, ChapterUpdate


class ChapterService:
    def __init__(self, novel_repo: NovelRepository, chapter_repo: ChapterRepository) -> None:
        self.novel_repo = novel_repo
        self.chapter_repo = chapter_repo

    async def _verify_novel_ownership(self, novel_id: uuid.UUID, user_id: uuid.UUID) -> None:
        novel = await self.novel_repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()

    async def create_chapter(
        self, novel_id: uuid.UUID, user_id: uuid.UUID, data: ChapterCreate
    ) -> Chapter:
        await self._verify_novel_ownership(novel_id, user_id)
        last = await self.chapter_repo.get_last_chapter(novel_id)
        order_key = (last.order_key + 1000.0) if last else 1000.0
        return await self.chapter_repo.create(
            novel_id, order_key=order_key, **data.model_dump(exclude_none=True)
        )

    async def get_chapter(
        self, novel_id: uuid.UUID, chapter_id: uuid.UUID, user_id: uuid.UUID
    ) -> Chapter:
        await self._verify_novel_ownership(novel_id, user_id)
        chapter = await self.chapter_repo.get_by_id(novel_id, chapter_id)
        if chapter is None:
            raise NotFoundError("Chapter")
        return chapter

    async def list_chapters(self, novel_id: uuid.UUID, user_id: uuid.UUID) -> list[Chapter]:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.chapter_repo.list_by_novel(novel_id)

    async def update_chapter(
        self,
        novel_id: uuid.UUID,
        chapter_id: uuid.UUID,
        user_id: uuid.UUID,
        data: ChapterUpdate,
    ) -> Chapter:
        chapter = await self.get_chapter(novel_id, chapter_id, user_id)
        return await self.chapter_repo.update(chapter, **data.model_dump(exclude_none=True))

    async def reorder_chapter(
        self,
        novel_id: uuid.UUID,
        chapter_id: uuid.UUID,
        user_id: uuid.UUID,
        order_key: float,
    ) -> Chapter:
        chapter = await self.get_chapter(novel_id, chapter_id, user_id)
        return await self.chapter_repo.update(chapter, order_key=order_key)

    async def delete_chapter(
        self, novel_id: uuid.UUID, chapter_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        chapter = await self.get_chapter(novel_id, chapter_id, user_id)
        await self.chapter_repo.delete(chapter)
