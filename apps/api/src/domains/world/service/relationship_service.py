"""CharacterRelationship application service."""

from __future__ import annotations

import uuid

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.models.world_models import CharacterRelationship
from domains.world.repository.character_repository import CharacterRepository
from domains.world.repository.relationship_repository import RelationshipRepository
from domains.world.schemas.world_schemas import (
    RelationshipCreate,
    RelationshipResponse,
    RelationshipUpdate,
)


class RelationshipService:
    def __init__(
        self,
        novel_repo: NovelRepository,
        character_repo: CharacterRepository,
        rel_repo: RelationshipRepository,
    ) -> None:
        self.novel_repo = novel_repo
        self.character_repo = character_repo
        self.rel_repo = rel_repo

    async def _verify_novel_ownership(
        self, novel_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        novel = await self.novel_repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()

    def _to_relationship_response(
        self, rel: CharacterRelationship, character_id: uuid.UUID
    ) -> RelationshipResponse:
        is_source = rel.character_id_a == character_id
        return RelationshipResponse(
            id=rel.id,
            novel_id=rel.novel_id,
            character_id_a=rel.character_id_a,
            character_id_b=rel.character_id_b,
            type=rel.type,
            description=rel.description,
            created_at=rel.created_at,
            updated_at=rel.updated_at,
            direction="source" if is_source else "target",
            other_character_id=rel.character_id_b if is_source else rel.character_id_a,
        )

    async def list_relationships(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        character_id: uuid.UUID,
    ) -> list[RelationshipResponse]:
        await self._verify_novel_ownership(novel_id, user_id)
        rels = await self.rel_repo.list_by_character(novel_id, character_id)
        return [self._to_relationship_response(r, character_id) for r in rels]

    async def create_relationship(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        character_id_a: uuid.UUID,
        data: RelationshipCreate,
    ) -> RelationshipResponse:
        await self._verify_novel_ownership(novel_id, user_id)
        rel = await self.rel_repo.create(
            novel_id,
            character_id_a,
            data.character_id_b,
            **data.model_dump(exclude={"character_id_b"}, exclude_none=True),
        )
        return self._to_relationship_response(rel, character_id_a)

    async def update_relationship(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        rel_id: uuid.UUID,
        character_id: uuid.UUID,
        data: RelationshipUpdate,
    ) -> RelationshipResponse:
        await self._verify_novel_ownership(novel_id, user_id)
        rel = await self.rel_repo.get_by_id(novel_id, rel_id)
        if rel is None:
            raise NotFoundError("Relationship")
        rel = await self.rel_repo.update(rel, **data.model_dump(exclude_unset=True))
        return self._to_relationship_response(rel, character_id)

    async def delete_relationship(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        rel_id: uuid.UUID,
    ) -> None:
        await self._verify_novel_ownership(novel_id, user_id)
        rel = await self.rel_repo.get_by_id(novel_id, rel_id)
        if rel is None:
            raise NotFoundError("Relationship")
        await self.rel_repo.delete(rel)
