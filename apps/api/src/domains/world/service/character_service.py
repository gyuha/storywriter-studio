"""Character application service."""

from __future__ import annotations

import uuid

from core.exceptions import ForbiddenError, NotFoundError
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.models.world_models import Character
from domains.world.repository.character_repository import CharacterRepository
from domains.world.schemas.world_schemas import CharacterCreate, CharacterUpdate


class CharacterService:
    def __init__(
        self,
        novel_repo: NovelRepository,
        character_repo: CharacterRepository,
    ) -> None:
        self.novel_repo = novel_repo
        self.character_repo = character_repo

    async def _verify_novel_ownership(
        self, novel_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        novel = await self.novel_repo.get_by_id(novel_id)
        if novel is None:
            raise NotFoundError("Novel")
        if novel.user_id != user_id:
            raise ForbiddenError()

    async def list_characters(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        name: str | None = None,
    ) -> list[Character]:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.character_repo.list_by_novel(novel_id, name=name)

    async def get_character(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        character_id: uuid.UUID,
    ) -> Character:
        await self._verify_novel_ownership(novel_id, user_id)
        character = await self.character_repo.get_by_id(novel_id, character_id)
        if character is None:
            raise NotFoundError("Character")
        return character

    async def create_character(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        data: CharacterCreate,
    ) -> Character:
        await self._verify_novel_ownership(novel_id, user_id)
        return await self.character_repo.create(
            novel_id, **data.model_dump(exclude_none=True)
        )

    async def update_character(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        character_id: uuid.UUID,
        data: CharacterUpdate,
    ) -> Character:
        character = await self.get_character(novel_id, user_id, character_id)
        return await self.character_repo.update(
            character, **data.model_dump(exclude_unset=True)
        )

    async def delete_character(
        self,
        novel_id: uuid.UUID,
        user_id: uuid.UUID,
        character_id: uuid.UUID,
    ) -> None:
        character = await self.get_character(novel_id, user_id, character_id)
        await self.character_repo.delete(character)
