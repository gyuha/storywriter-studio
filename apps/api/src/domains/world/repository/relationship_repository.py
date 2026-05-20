"""Repository for CharacterRelationship entity."""

from __future__ import annotations

import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from domains.world.models.world_models import CharacterRelationship


class RelationshipRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(
        self, novel_id: uuid.UUID, rel_id: uuid.UUID
    ) -> CharacterRelationship | None:
        result = await self.session.execute(
            select(CharacterRelationship).where(
                CharacterRelationship.id == rel_id,
                CharacterRelationship.novel_id == novel_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_character(
        self, novel_id: uuid.UUID, character_id: uuid.UUID
    ) -> list[CharacterRelationship]:
        stmt = (
            select(CharacterRelationship)
            .where(
                CharacterRelationship.novel_id == novel_id,
                or_(
                    CharacterRelationship.character_id_a == character_id,
                    CharacterRelationship.character_id_b == character_id,
                ),
            )
            .order_by(CharacterRelationship.created_at.asc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self,
        novel_id: uuid.UUID,
        character_id_a: uuid.UUID,
        character_id_b: uuid.UUID,
        **fields: object,
    ) -> CharacterRelationship:
        rel = CharacterRelationship(
            novel_id=novel_id,
            character_id_a=character_id_a,
            character_id_b=character_id_b,
            **fields,
        )
        self.session.add(rel)
        await self.session.flush()
        await self.session.refresh(rel)
        return rel

    async def update(
        self, rel: CharacterRelationship, **fields: object
    ) -> CharacterRelationship:
        for k, v in fields.items():
            setattr(rel, k, v)
        await self.session.flush()
        await self.session.refresh(rel)
        return rel

    async def delete(self, rel: CharacterRelationship) -> None:
        await self.session.delete(rel)
        await self.session.flush()
