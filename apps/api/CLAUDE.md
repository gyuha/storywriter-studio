# CLAUDE.md — apps/api

FastAPI 백엔드 작업 시 참조하는 지침.

## Commands

```bash
# 인프라 실행 (PostgreSQL 16, Redis 7, Mailpit)
docker compose up -d

# 개발 서버
uv run uvicorn src.main:app --reload

# DB 마이그레이션
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "description"

# 테스트
uv run pytest                                      # 전체
uv run pytest tests/unit/auth/test_auth_service.py # 단일 파일
uv run pytest -m unit                              # 단위 테스트만
uv run pytest -m integration                       # 통합 테스트만

# 린트/포맷/타입 체크
uv run ruff check .
uv run ruff format .
uv run mypy src/
```

## 도메인 구조

```
src/domains/
  auth/      — 인증, JWT, OAuth, 사용자 관리
  novel/     — 소설, 챕터, 스토리 비트, AI 초안 생성
  world/     — 캐릭터, 장소, 관계, 타임라인, 세계관 설정
  chat/      — LLM 채팅 (ports.py Protocol 기반)
  shared/    — 공용 기반 타입 (Entity, AggregateRoot)
```

각 도메인의 내부 구조:
```
domains/<name>/
  router/<name>_router.py    # FastAPI APIRouter — 요청 검증, 응답 직렬화
  service/<name>_service.py  # 비즈니스 로직 — AppError를 raise, HTTPException 금지
  repository/<name>_repository.py  # 모든 DB I/O (AsyncSession)
  models/<name>_models.py    # SQLAlchemy ORM 모델
  schemas/<name>_schemas.py  # Pydantic 요청/응답 스키마
```

## 핵심 패턴

### 에러 처리
- Service 레이어: `AppError` 서브클래스 raise (`NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`)
- Router 레이어: `_app_error_to_http()` 로 HTTP 응답으로 변환
- `HTTPException`을 service 코드에서 직접 raise하지 않는다

### LLM 격리
- `langchain_litellm` 임포트는 `infra/llm/provider_factory.py` 전용
- `langchain_core.messages`는 `chat/llm_client.py`와 `novel/router/draft_router.py`에서 사용 — 의도적 설계
- `chat/ports.py` Protocol/ABC에 의존하면 LLM 프로바이더 교체 시 코드 변경 불필요

### 도메인 격리
- `auth`, `chat`, `novel`, `world`는 서로 import 금지
- 모든 도메인은 `shared`와 `core`를 import 가능

### AI 초안 생성 (draft_router)
- `novel/router/draft_router.py` — SSE 스트리밍으로 챕터 초안 생성
- `POST /novels/{novel_id}/chapters/{chapter_id}/draft`
- `chat` 도메인의 LLM 클라이언트를 재사용하지 않고 직접 `langchain_core` 메시지 구성

### 로깅
- `print()` 사용 금지 — `T20` ruff 규칙으로 강제
- `structlog`를 사용. `logger.info("event_name", key=value)` 형식

### Pydantic 모델
- ORM 연동 모델: `model_config = ConfigDict(from_attributes=True)`
- `field_validator` 사용 (Pydantic v2); 정규화에는 `mode="before"`
