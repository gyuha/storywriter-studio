"""Unit tests for NovelService."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.models.novel_models import Novel
from domains.novel.schemas.novel_schemas import NovelCreate, NovelUpdate
from domains.novel.service.novel_service import NovelService


def make_novel(user_id=None, **kwargs):
    novel = MagicMock(spec=Novel)
    novel.id = uuid.uuid4()
    novel.user_id = user_id or uuid.uuid4()
    novel.title = kwargs.get("title", "Test Novel")
    novel.genre = kwargs.get("genre", None)
    novel.description = kwargs.get("description", None)
    novel.cover_image_url = None
    novel.created_at = datetime.now(timezone.utc)
    novel.updated_at = datetime.now(timezone.utc)
    return novel


@pytest.mark.asyncio
async def test_create_novel():
    repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id, title="My Novel")
    repo.create.return_value = novel
    service = NovelService(repo)
    result = await service.create_novel(user_id, NovelCreate(title="My Novel"))
    assert result.title == "My Novel"
    repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_get_novel_not_found():
    repo = AsyncMock()
    repo.get_by_id.return_value = None
    service = NovelService(repo)
    with pytest.raises(NotFoundError):
        await service.get_novel(uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_get_novel_forbidden():
    repo = AsyncMock()
    user_id = uuid.uuid4()
    other_user_id = uuid.uuid4()
    novel = make_novel(user_id=other_user_id)
    repo.get_by_id.return_value = novel
    service = NovelService(repo)
    with pytest.raises(ForbiddenError):
        await service.get_novel(novel.id, user_id)


@pytest.mark.asyncio
async def test_list_novels_filters_by_user():
    """CRITICAL: chapter_count must come from subquery result, not hardcoded 0."""
    repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id)
    # Mock returns (Novel, chapter_count) tuples — chapter_count = 3
    repo.list_by_user.return_value = ([(novel, 3)], 1)
    service = NovelService(repo)
    items, total = await service.list_novels(user_id)
    assert total == 1
    assert len(items) == 1
    assert items[0].chapter_count == 3, "chapter_count must be 3 from subquery, not 0"


@pytest.mark.asyncio
async def test_update_novel():
    repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id, title="Old Title")
    updated = make_novel(user_id=user_id, title="New Title")
    repo.get_by_id.return_value = novel
    repo.update.return_value = updated
    service = NovelService(repo)
    result = await service.update_novel(novel.id, user_id, NovelUpdate(title="New Title"))
    assert result.title == "New Title"
    repo.update.assert_called_once()


@pytest.mark.asyncio
async def test_delete_novel():
    repo = AsyncMock()
    user_id = uuid.uuid4()
    novel = make_novel(user_id=user_id)
    repo.get_by_id.return_value = novel
    service = NovelService(repo)
    await service.delete_novel(novel.id, user_id)
    repo.delete.assert_called_once_with(novel)
