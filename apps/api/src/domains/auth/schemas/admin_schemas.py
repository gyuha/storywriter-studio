from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class AdminUserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    email: EmailStr
    display_name: str | None
    is_verified: bool
    is_active: bool
    created_at: datetime


class PaginatedUsersResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    size: int
