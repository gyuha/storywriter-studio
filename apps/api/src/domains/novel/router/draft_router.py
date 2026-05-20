"""AI chapter draft generation router.

POST /novels/{novel_id}/chapters/{chapter_id}/draft  — SSE streaming draft
"""

from __future__ import annotations

import uuid
from typing import Any, Literal

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from core.database import get_async_session
from domains.auth.models import User
from domains.auth.security import get_current_user
from domains.chat.container import get_chat_service
from domains.chat.service import ChatService
from domains.novel.repository.chapter_repository import ChapterRepository
from domains.novel.repository.novel_repository import NovelRepository
from domains.world.repository.character_repository import CharacterRepository
from domains.world.repository.location_repository import LocationRepository
from domains.world.repository.world_setting_repository import WorldSettingRepository

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["draft"])


class ContextItem(BaseModel):
    type: Literal["character", "location", "world_setting"]
    id: uuid.UUID


class DraftRequest(BaseModel):
    context_items: list[ContextItem] = []
    include_prev_summary: bool = True


@router.post("/{novel_id}/chapters/{chapter_id}/draft")
async def generate_draft(
    novel_id: uuid.UUID,
    chapter_id: uuid.UUID,
    body: DraftRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
    service: ChatService = Depends(get_chat_service),
) -> EventSourceResponse:
    novel_repo = NovelRepository(session)
    novel = await novel_repo.get_by_id(novel_id)
    if novel is None or novel.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Novel not found.")

    chapter_repo = ChapterRepository(session)
    chapter = await chapter_repo.get_by_id(novel_id, chapter_id)
    if chapter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found.")

    char_repo = CharacterRepository(session)
    loc_repo = LocationRepository(session)
    ws_repo = WorldSettingRepository(session)

    char_lines: list[str] = []
    loc_lines: list[str] = []
    ws_lines: list[str] = []

    for item in body.context_items:
        if item.type == "character":
            c = await char_repo.get_by_id(novel_id, item.id)
            if c:
                line = f"- 이름: {c.name}"
                if c.role:
                    line += f" | 역할: {c.role}"
                if c.summary:
                    line += f" | 요약: {c.summary}"
                char_lines.append(line)
        elif item.type == "location":
            loc = await loc_repo.get_by_id(novel_id, item.id)
            if loc:
                line = f"- 이름: {loc.name}"
                if loc.summary:
                    line += f" | 요약: {loc.summary}"
                loc_lines.append(line)
        elif item.type == "world_setting":
            ws = await ws_repo.get_by_id(novel_id, item.id)
            if ws:
                line = f"- 이름: {ws.name} ({ws.type.value})"
                if ws.summary:
                    line += f" | 요약: {ws.summary}"
                ws_lines.append(line)

    context_sections: list[str] = []
    if char_lines:
        context_sections.append("### 등장 캐릭터\n" + "\n".join(char_lines))
    if loc_lines:
        context_sections.append("### 장소 / 배경\n" + "\n".join(loc_lines))
    if ws_lines:
        context_sections.append("### 세계관 설정\n" + "\n".join(ws_lines))

    prev_chapter_text = ""
    if body.include_prev_summary:
        chapters = await chapter_repo.list_by_novel(novel_id)
        current_index = next((i for i, c in enumerate(chapters) if c.id == chapter_id), -1)
        if current_index > 0:
            prev = chapters[current_index - 1]
            if prev.content:
                extracted = _extract_text(prev.content)
                if extracted:
                    prev_chapter_text = f"## 이전 챕터 내용\n{extracted[:1000]}"

    system_parts = [
        "당신은 웹소설 집필을 돕는 AI 어시스턴트입니다. "
        "아래 세계관 설정을 참고하여 챕터의 다음 내용을 자연스럽게 이어서 작성해주세요.",
    ]
    if context_sections:
        system_parts.append("\n## 세계관 컨텍스트\n" + "\n\n".join(context_sections))
    if prev_chapter_text:
        system_parts.append("\n" + prev_chapter_text)
    system_parts.append(f"\n## 현재 챕터 제목\n{chapter.title}")
    system_parts.append("\n자연스러운 웹소설 문체로 500~800자 분량의 다음 내용을 작성해주세요.")

    lc_messages = [
        SystemMessage(content="\n".join(system_parts)),
        HumanMessage(content=f"'{chapter.title}' 챕터의 다음 내용을 작성해주세요."),
    ]

    async def _event_gen() -> Any:
        try:
            logger.info("draft_stream_start", novel_id=str(novel_id), chapter_id=str(chapter_id))
            async for chunk in service.stream(lc_messages):
                yield {"data": chunk}
            yield {"data": "[DONE]"}
            logger.info("draft_stream_complete")
        except Exception as exc:
            logger.error("draft_stream_error", error=str(exc), exc_info=True)
            yield {"event": "error", "data": str(exc)}

    return EventSourceResponse(_event_gen())


def _extract_text(node: object) -> str:
    if not isinstance(node, dict):
        return ""
    if node.get("type") == "text":
        return str(node.get("text", ""))
    return "".join(_extract_text(child) for child in node.get("content", []))
