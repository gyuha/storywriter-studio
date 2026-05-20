"""Timeline application service."""

from __future__ import annotations

import uuid

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.models.world_models import Timeline
from domains.world.repository.timeline_repository import TimelineRepository
from domains.world.schemas.world_schemas import TimelineCreate, TimelineUpdate


class TimelineService:
    def __init__(
        self,
        novel_repo: NovelRepository,
        timeline_repo: TimelineRepository,
    ) -> None:
        self.novel_repo = novel_repo
        self.timeline_repo = timeline_repo

    async def _verify_novel_ownership(
        self, novel_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        novel = await self.novel_repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()

    async def list_timelines(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> list[Timeline]:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.timeline_repo.list_by_novel(novel_id)

    async def get_timeline(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        timeline_id: uuid.UUID,
    ) -> Timeline:
        await self._verify_novel_ownership(novel_id, user_id)
        timeline = await self.timeline_repo.get_by_id(novel_id, timeline_id)
        if timeline is None:
            raise NotFoundError("Timeline")
        return timeline

    async def create_timeline(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        data: TimelineCreate,
    ) -> Timeline:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.timeline_repo.create(
            novel_id, **data.model_dump(exclude_none=True)
        )

    async def update_timeline(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        timeline_id: uuid.UUID,
        data: TimelineUpdate,
    ) -> Timeline:
        timeline = await self.get_timeline(novel_id, user_id, timeline_id)
        return await self.timeline_repo.update(
            timeline, **data.model_dump(exclude_unset=True)
        )

    async def delete_timeline(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        timeline_id: uuid.UUID,
    ) -> None:
        timeline = await self.get_timeline(novel_id, user_id, timeline_id)
        await self.timeline_repo.delete(timeline)
