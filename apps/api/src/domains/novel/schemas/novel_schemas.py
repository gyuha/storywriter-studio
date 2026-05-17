"""Pydantic request/response schemas for the Novel domain."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from domains.novel.models.novel_models import ChapterStatus


class NovelCreate(BaseModel):
    title: str
    genre: str | None = None
    description: str | None = None
    cover_image_url: str | None = None


class NovelUpdate(BaseModel):
    title: str | None = None
    genre: str | None = None
    description: str | None = None
    cover_image_url: str | None = None


class NovelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    genre: str | None
    description: str | None
    cover_image_url: str | None
    created_at: datetime
    updated_at: datetime
    chapter_count: int = 0


class NovelListResponse(BaseModel):
    items: list[NovelResponse]
    total: int


class ChapterCreate(BaseModel):
    title: str
    content: dict | None = None  # D-28: JSONB — TipTap getJSON() output


class ChapterUpdate(BaseModel):
    title: str | None = None
    content: dict | None = None  # D-28: JSONB
    status: ChapterStatus | None = None


class ChapterReorderRequest(BaseModel):
    order_key: float


class ChapterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    novel_id: uuid.UUID
    title: str
    content: dict | None = None  # D-28: JSONB
    order_key: float
    status: ChapterStatus
    created_at: datetime
    updated_at: datetime
