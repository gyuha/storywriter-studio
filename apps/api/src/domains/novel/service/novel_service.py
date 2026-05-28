"""Novel application service."""

from __future__ import annotations

import uuid

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.models.novel_models import Novel
from domains.novel.repository.novel_repository import NovelRepository
from domains.novel.schemas.novel_schemas import NovelCreate, NovelResponse, NovelUpdate


class NovelService:
    def __init__(self, repo: NovelRepository) -> None:
        self.repo = repo

    async def create_novel(self, user_id: uuid.UUID, data: NovelCreate) -> Novel:
        return await self.repo.create(user_id, **data.model_dump(exclude_none=True))

    async def get_novel(self, novel_id: uuid.UUID, user_id: uuid.UUID) -> Novel:
        novel = await self.repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()
        return novel

    async def list_novels(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> tuple[list[NovelResponse], int]:
        rows, total = await self.repo.list_by_user(user_id, offset, limit)
        items = [
            NovelResponse(
                id=novel.id,
                user_id=novel.user_id,
                title=novel.title,
                genre=novel.genre,
                description=novel.description,
                cover_image_url=novel.cover_image_url,
                tagline=novel.tagline,
                tags=novel.tags,
                created_at=novel.created_at,
                updated_at=novel.updated_at,
                chapter_count=count,
            )
            for novel, count in rows
        ]
        return items, total

    async def update_novel(
        self, novel_id: uuid.UUID, user_id: uuid.UUID, data: NovelUpdate
    ) -> Novel:
        novel = await self.get_novel(novel_id, user_id)
        return await self.repo.update(novel, **data.model_dump(exclude_unset=True))

    async def delete_novel(self, novel_id: uuid.UUID, user_id: uuid.UUID) -> None:
        novel = await self.get_novel(novel_id, user_id)
        await self.repo.delete(novel)
