"""World domain combined router.

Mounts character, location, and world_setting sub-routers under
/novels/{novel_id}.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError, NotFoundError
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.repository.character_repository import CharacterRepository
from domains.world.repository.relationship_repository import RelationshipRepository

from .character_router import router as character_router
from .location_router import router as location_router
from .relationship_router import router as relationship_router
from .timeline_router import router as timeline_router
from .world_setting_router import router as world_setting_router

router = APIRouter(prefix="/novels/{novel_id}")
router.include_router(character_router)
router.include_router(location_router)
router.include_router(world_setting_router)
router.include_router(timeline_router)
router.include_router(relationship_router)


@router.get("/graph")
async def get_character_graph(
    novel_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> dict:
    novel_repo = NovelRepository(session)
    novel = await novel_repo.get_by_id(novel_id)
    if not novel or novel.user_id != current_user.id:
        raise NotFoundError("소설을 찾을 수 없습니다")

    char_repo = CharacterRepository(session)
    rel_repo = RelationshipRepository(session)

    characters = await char_repo.list_by_novel(novel_id)
    relationships = await rel_repo.list_by_novel(novel_id)

    return {
        "nodes": [{"id": str(c.id), "name": c.name, "role": c.role} for c in characters],
        "edges": [
            {
                "id": str(r.id),
                "source": str(r.character_id_a),
                "target": str(r.character_id_b),
                "type": r.type.value,
                "description": r.description,
            }
            for r in relationships
        ],
    }
