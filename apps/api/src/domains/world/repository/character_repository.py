"""Repository for Character entity."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.world.models.world_models import Character


class CharacterRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self, novel_id: uuid.UUID, character_id: uuid.UUID
    ) -> Character | None:
        result = await self.session.execute(
            select(Character).where(
                Character.id == character_id, Character.novel_id == novel_id
            )
        )
        return result.scalar_one_or_none()

    async def list_by_novel(
        self, novel_id: uuid.UUID, name: str | None = None
    ) -> list[Character]:
        stmt = select(Character).where(Character.novel_id == novel_id)
        if name:
            stmt = stmt.where(Character.name.ilike(f"%{name}%"))
        stmt = stmt.order_by(Character.created_at.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, novel_id: uuid.UUID, **fields: object) -> Character:
        character = Character(novel_id=novel_id, **fields)
        self.session.add(character)
        await self.session.flush()
        await self.session.refresh(character)
        return character

    async def update(self, character: Character, **fields: object) -> Character:
        for k, v in fields.items():
            setattr(character, k, v)
        await self.session.flush()
        await self.session.refresh(character)
        return character

    async def delete(self, character: Character) -> None:
        await self.session.delete(character)
        await self.session.flush()
