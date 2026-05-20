"""World domain combined router.

Mounts character, location, and world_setting sub-routers under
/novels/{novel_id}.
"""

from __future__ import annotations

from fastapi import APIRouter

from .character_router import router as character_router
from .location_router import router as location_router
from .world_setting_router import router as world_setting_router

router = APIRouter(prefix="/novels/{novel_id}")
router.include_router(character_router)
router.include_router(location_router)
router.include_router(world_setting_router)
