"""Pydantic request/response schemas for the World domain."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from domains.world.models.world_models import RelationshipType, WorldSettingType


# ─── Character ────────────────────────────────────────────────────────────────


class CharacterCreate(BaseModel):
    name: str
    appearance: str | None = None
    personality: str | None = None
    background: str | None = None
    role: str | None = None
    summary: str | None = None


class CharacterUpdate(BaseModel):
    name: str | None = None
    appearance: str | None = None
    personality: str | None = None
    background: str | None = None
    role: str | None = None
    summary: str | None = None


class CharacterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    novel_id: uuid.UUID
    name: str
    appearance: str | None
    personality: str | None
    background: str | None
    role: str | None
    summary: str | None
    created_at: datetime
    updated_at: datetime


# ─── Location ─────────────────────────────────────────────────────────────────


class LocationCreate(BaseModel):
    name: str
    description: str | None = None
    location_relation: str | None = None
    summary: str | None = None


class LocationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location_relation: str | None = None
    summary: str | None = None


class LocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    novel_id: uuid.UUID
    name: str
    description: str | None
    location_relation: str | None
    summary: str | None
    created_at: datetime
    updated_at: datetime


# ─── WorldSetting ─────────────────────────────────────────────────────────────


class WorldSettingCreate(BaseModel):
    name: str
    type: WorldSettingType
    content: dict = Field(default_factory=dict)
    summary: str | None = None


class WorldSettingUpdate(BaseModel):
    name: str | None = None
    type: WorldSettingType | None = None
    content: dict | None = None
    summary: str | None = None


class WorldSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    novel_id: uuid.UUID
    name: str
    type: WorldSettingType
    content: dict
    summary: str | None
    created_at: datetime
    updated_at: datetime


# ─── Timeline ─────────────────────────────────────────────────────────────────


class TimelineCreate(BaseModel):
    event_name: str
    event_date: str | None = None
    description: str | None = None
    summary: str | None = None
    chapter_id: uuid.UUID | None = None


class TimelineUpdate(BaseModel):
    event_name: str | None = None
    event_date: str | None = None
    description: str | None = None
    summary: str | None = None
    chapter_id: uuid.UUID | None = None


class TimelineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    novel_id: uuid.UUID
    event_name: str
    event_date: str | None
    description: str | None
    summary: str | None
    chapter_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


# ─── Relationship (calculated direction, no from_attributes) ──────────────────


class RelationshipCreate(BaseModel):
    character_id_b: uuid.UUID
    type: RelationshipType
    description: str | None = None


class RelationshipUpdate(BaseModel):
    type: RelationshipType | None = None
    description: str | None = None


class RelationshipResponse(BaseModel):
    """direction과 other_character_id는 서비스에서 수동 계산하여 채운다."""

    id: uuid.UUID
    novel_id: uuid.UUID
    character_id_a: uuid.UUID
    character_id_b: uuid.UUID
    type: RelationshipType
    description: str | None
    direction: Literal["source", "target"]
    other_character_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
