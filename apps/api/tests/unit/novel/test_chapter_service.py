"""Unit tests for ChapterService."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.models.novel_models import Chapter, Novel
from domains.novel.schemas.novel_schemas import ChapterCreate
from domains.novel.service.chapter_service import ChapterService


def make_novel(user_id=None):
    novel = MagicMock(spec=Novel)
    novel.id = uuid.uuid4()
    novel.user_id = user_id or uuid.uuid4()
    return novel


def make_chapter(novel_id=None, order_key=1000.0):
    ch = MagicMock(spec=Chapter)
    ch.id = uuid.uuid4()
    ch.novel_id = novel_id or uuid.uuid4()
    ch.order_key = order_key
    ch.title = "Chapter 1"
    ch.content = None
    ch.status = "draft"
    ch.created_at = datetime.now(timezone.utc)
    ch.updated_at = datetime.now(timezone.utc)
    return ch


@pytest.mark.asyncio
async def test_create_chapter_assigns_order_key():
    novel_repo = AsyncMock()
    chapter_repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id)
    novel_repo.get_by_id.return_value = novel
    chapter_repo.get_last_chapter.return_value = None  # no existing chapters
    chapter = make_chapter(novel_id=novel.id, order_key=1000.0)
    chapter_repo.create.return_value = chapter
    service = ChapterService(novel_repo, chapter_repo)
    await service.create_chapter(novel.id, user_id, ChapterCreate(title="Chapter 1"))
    # order_key should be 1000.0 when no previous chapter
    call_kwargs = chapter_repo.create.call_args
    assert call_kwargs[1]["order_key"] == 1000.0


@pytest.mark.asyncio
async def test_create_chapter_increments_order_key():
    novel_repo = AsyncMock()
    chapter_repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id)
    novel_repo.get_by_id.return_value = novel
    last_chapter = make_chapter(novel_id=novel.id, order_key=2000.0)
    chapter_repo.get_last_chapter.return_value = last_chapter
    new_chapter = make_chapter(novel_id=novel.id, order_key=3000.0)
    chapter_repo.create.return_value = new_chapter
    service = ChapterService(novel_repo, chapter_repo)
    await service.create_chapter(novel.id, user_id, ChapterCreate(title="Chapter 2"))
    call_kwargs = chapter_repo.create.call_args
    assert call_kwargs[1]["order_key"] == 3000.0


@pytest.mark.asyncio
async def test_create_chapter_novel_not_found():
    novel_repo = AsyncMock()
    chapter_repo = AsyncMock()
    novel_repo.get_by_id.return_value = None
    service = ChapterService(novel_repo, chapter_repo)
    with pytest.raises(NotFoundError):
        await service.create_chapter(uuid.uuid4(), uuid.uuid4(), ChapterCreate(title="Ch1"))


@pytest.mark.asyncio
async def test_create_chapter_forbidden():
    novel_repo = AsyncMock()
    chapter_repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=uuid.uuid4())  # owned by someone else
    novel_repo.get_by_id.return_value = novel
    service = ChapterService(novel_repo, chapter_repo)
    with pytest.raises(ForbiddenError):
        await service.create_chapter(novel.id, user_id, ChapterCreate(title="Ch1"))


@pytest.mark.asyncio
async def test_reorder_chapter():
    novel_repo = AsyncMock()
    chapter_repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id)
    novel_repo.get_by_id.return_value = novel
    chapter = make_chapter(novel_id=novel.id, order_key=1000.0)
    chapter_repo.get_by_id.return_value = chapter
    updated = make_chapter(novel_id=novel.id, order_key=1500.0)
    chapter_repo.update.return_value = updated
    service = ChapterService(novel_repo, chapter_repo)
    await service.reorder_chapter(novel.id, chapter.id, user_id, 1500.0)
    chapter_repo.update.assert_called_once_with(chapter, order_key=1500.0)


@pytest.mark.asyncio
async def test_delete_chapter():
    novel_repo = AsyncMock()
    chapter_repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id)
    novel_repo.get_by_id.return_value = novel
    chapter = make_chapter(novel_id=novel.id)
    chapter_repo.get_by_id.return_value = chapter
    service = ChapterService(novel_repo, chapter_repo)
    await service.delete_chapter(novel.id, chapter.id, user_id)
    chapter_repo.delete.assert_called_once_with(chapter)
