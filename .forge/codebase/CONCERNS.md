---
last_mapped_commit: c7938e3315a98f4acd930e6b82b54df325e8f755
mapped: 2026-06-14
---

# CONCERNS

StoryWriter Studio 코드베이스의 기술 부채, 위험 영역, 알려진 이슈를 코드 근거와 함께 정리한다. 각 항목은 구체적인 파일 경로를 인용하고, 왜 문제인지를 설명한다. 깨끗한 영역은 솔직하게 깨끗하다고 표기한다.

## 1. 기술 부채 (Tech Debt)

### 1.1 SDK 미생성 엔드포인트의 수동 fetch 래퍼 — 3건 [높음]

프론트엔드 일부 API 호출이 HeyAPI 생성 SDK 대신 수동 fetch로 구현되어 있고, 명시적 TODO로 표시되어 있다.

- `apps/web/src/features/world/hooks/use-character-graph.ts:23` — `/novels/:id/graph` 엔드포인트가 `openapi.json`에 없어 수동 구현
- `apps/web/src/features/novel/lib/beat-api.ts:1` — `/novels/:id/story-beats` 미생성
- `apps/web/src/features/novel/lib/novel-api.ts:65` — `/novels/:id/stats` 미생성

왜 문제인가: 백엔드 스펙 변경 시 타입 동기화가 깨질 수 있다(SDK는 `openapi.json`에서 자동 생성되지만 이 호출들은 수동이라 자동 검증되지 않음). 다만 TODO가 명확히 달려 있고 마이그레이션 경로가 적혀 있어 부채로서 관리되고 있다. TODO/FIXME/HACK/XXX 마커는 전체 코드베이스에서 이 3건이 전부로, 마커 기준 부채는 매우 적다.

### 1.2 선언했으나 사용하지 않는 의존성: `tenacity` [높음]

`apps/api/pyproject.toml`(및 CLAUDE.md 기술 스택)에 `tenacity >=8.5.0`이 "Retry logic for transient LLM errors" 목적으로 선언되어 있으나, `apps/api/src/` 전체에서 `tenacity`/`retry`/`@retry` 사용처가 0건이다(grep 결과 없음).

왜 문제인가: LLM provider 호출(`apps/api/src/domains/chat/llm_client.py`의 `ainvoke`/`astream`, `infra/llm/provider_factory.py`)에 재시도 로직이 전혀 없다. provider의 일시적 5xx/rate-limit/타임아웃 시 사용자에게 즉시 실패가 전파된다. SSE 초안 생성·채팅 모두 단발성 호출이라 transient 오류에 취약하다. 의존성은 설치되어 있으나 와이어링되지 않은 상태다.

### 1.3 `0004_merge_0002_and_0003.py` 빈 merge 마이그레이션 [중간]

`apps/api/alembic/versions/0004_merge_0002_and_0003.py`는 `upgrade()`/`downgrade()`가 모두 `pass`인 merge revision이다. revision id가 파일명(`0004_...`)과 다른 자동생성 해시(`22e20af02e5a`)라서 후속 마이그레이션(`0005`)의 `down_revision = "22e20af02e5a"`와의 연결을 추적하기 어렵다. 동작상 문제는 아니지만(merge는 정상), 명명 일관성이 깨져 있어 히스토리 가독성이 떨어진다.

## 2. 버그 / 취약 영역 (Bugs / Fragile Areas)

### 2.1 SSE 스트리밍 중 user 메시지 커밋 누락 위험 [중간]

`apps/api/src/domains/chat/router/chat_router.py`의 `send_message` (425~544행):

- 463행에서 user 메시지를 `repo.add_message(...)`로 추가하지만, 이 호출은 `flush()`만 하고 `commit()`하지 않는다(`chat_repository.py:94`는 `flush`만 수행).
- 실제 `session.commit()`은 SSE 스트림이 끝난 뒤 `_event_gen`의 `finally` 블록(532행)에서만 호출된다.
- 클라이언트가 스트림 도중 연결을 끊으면(프론트의 `AbortController`, `use-ai-draft.ts:38`/`cancel`) 서버 제너레이터가 중단되어 `finally`의 commit까지 도달하지 못할 수 있고, 이 경우 user 메시지와 assistant 메시지가 모두 롤백된다. 즉 "유저가 보낸 메시지가 사라지는" 상태가 가능하다.
- `finally` 블록은 `collected_chunks`가 비어있지 않으면 부분 응답이라도 `finish_reason="stop"`으로 저장한다(521~531행). 즉 중간에 끊긴 부분 응답이 "정상 완료(stop)"로 기록되어 데이터 정합성이 흐려진다.

### 2.2 SSE 에러를 본문 문자열로 그대로 노출 [중간]

`draft_router.py:140`과 `chat_router.py:307,520`은 예외 발생 시 `yield {"event": "error", "data": str(exc)}`로 **원본 예외 메시지를 클라이언트에 그대로 전송**한다. LLM provider 오류 메시지에 내부 모델명·API 엔드포인트·키 형식 힌트 등이 섞일 수 있어 정보 노출 위험이 있다(키 값 자체는 보통 포함되지 않으나 provider 내부 정보가 새어나갈 수 있음). 비스트리밍 경로(`chat_router.py:488`)도 `detail=f"LLM provider error: {exc!s}"`로 동일하게 노출한다.

### 2.3 draft_router의 N+1 컨텍스트 조회 [중간]

`apps/api/src/domains/novel/router/draft_router.py:71~94`는 `body.context_items`를 순회하며 각 항목마다 개별 `get_by_id`를 await한다(캐릭터/장소/세계관 각각 1 쿼리). 컨텍스트 항목이 N개면 N번의 순차 DB 라운드트립이 발생한다. 작가가 다수 설정을 컨텍스트로 첨부하면 초안 생성 지연이 누적된다. `asyncio.gather` 병렬화 또는 `IN` 절 배치 조회로 개선 여지가 있다.

### 2.4 이전 챕터 텍스트 1000자 단순 절단 [낮음]

`draft_router.py:113` — `extracted[:1000]`으로 이전 챕터 본문을 1000자에서 무조건 잘라 프롬프트에 넣는다. 토큰 기반이 아닌 문자 기반 절단이라 컨텍스트 품질이 들쭉날쭉하고, 문장 중간에서 잘릴 수 있다. 기능적 버그는 아니나 AI 컨텍스트 일관성이라는 핵심 가치(CLAUDE.md의 Core Value)에 직접 영향을 준다.

### 2.5 Google OAuth `exchange_code` 시그니처 불일치 (방어됨) [낮음]

`apps/api/src/domains/auth/oauth/google.py:58`의 `exchange_code(self, code)`는 인자가 `code` 하나다. 라우터(`auth_router.py:331~334`)는 provider가 `naver`일 때만 `exchange_code(code, state)`로 두 인자를 넘기고, 그 외에는 `exchange_code(code)`로 호출하므로 현재는 정상 동작한다. 다만 adapter 간 인터페이스가 통일되어 있지 않아(`naver.py`는 `(code, state)`, `google.py`는 `(code)`) provider 분기 로직이 라우터에 하드코딩되어 있다. 새 provider 추가 시 이 불일치가 버그를 유발하기 쉽다.

### 2.6 광범위 `except Exception` 사용 [낮음]

`apps/api/src/domains/`에 `except Exception` 11건이 존재한다. 대부분 SSE 제너레이터·`_auto_title`·readiness 체크 등 "실패해도 흐름을 막지 않아야 하는" 경로에 의도적으로 쓰였고 `logger.error(..., exc_info=True)`로 로깅된다. 의도는 합리적이나, 채팅 자동 제목 생성 실패(`_auto_title`)나 메시지 영속화 실패(`chat_router.py:537`)가 조용히 삼켜져 사용자에게 신호가 가지 않는다.

## 3. 보안 (Security)

> 실제 시크릿/키 값은 본 문서에 포함하지 않는다. 처리 메커니즘만 기술한다.

### 3.1 토큰을 `localStorage`에 저장 — XSS 노출면 [높음]

`apps/web/src/lib/api-client.ts:8`, `apps/web/src/features/auth/hooks/use-auth-mutation.ts:15-16,36-37`, `apps/web/src/features/novel/hooks/use-ai-draft.ts:25` — access/refresh 토큰을 `localStorage`에 평문 저장하고 거기서 읽어 `Authorization: Bearer` 헤더에 주입한다.

왜 문제인가: 백엔드 `security.py:10-14` 문서는 "Bearer header only — no cookies"를 명시하나, 그 결과 토큰이 `localStorage`에 노출되어 임의의 XSS가 access **및 refresh** 토큰을 모두 탈취할 수 있다. refresh 토큰(TTL 7일)까지 노출되므로 탈취 시 장기 세션 하이재킹이 가능하다. HttpOnly 쿠키 대비 명백히 약한 저장 방식이다. 이는 설계 결정이지만 위험을 명시해 둔다.

### 3.2 기본 시크릿 placeholder 값 [중간]

`apps/api/src/core/config.py`는 다수 시크릿에 개발용 기본값을 둔다: `secret_key=SecretStr("change-me-in-production")` (288행), `jwt_secret_key=SecretStr("change-me-jwt-secret-key")` (327행), `postgres_password=SecretStr("app")` (314행).

왜 문제인가: production 환경에서 이 값들이 교체되지 않아도 앱이 **기동을 거부하지 않는다**. `is_production()` 헬퍼(554행)는 존재하지만 시크릿이 기본값인지 검증하는 startup 가드가 없다. JWT 서명 키가 기본값으로 배포되면 누구나 유효한 토큰을 위조할 수 있다(HS256, `security.py:57`). 모든 시크릿은 `SecretStr`로 감싸 로그 노출은 방지되어 있으나, 기본값 교체 강제가 없다.

### 3.3 인증·인가 표면 — 대체로 견고 [높음]

- JWT: HS256, access 15분/refresh 7일 TTL, `jti` 기반 Redis 블랙리스트를 모든 요청에서 검증(`security.py:296-377`의 `get_current_user`). 토큰 타입(`access`) 검증, `sub` UUID 파싱, 사용자 active 여부까지 확인한다.
- refresh 토큰: 원본은 `secrets.token_urlsafe(48)`, DB에는 SHA-256 해시만 저장(`security.py:161,226-228`), rotation family(`fid`) 기반 재사용 탐지(`auth_service.py:71-94,293,318`)까지 구현되어 있다.
- 비밀번호: argon2(`passlib`, `security.py:73`).
- OAuth CSRF: `state` nonce를 `secrets.token_urlsafe(32)`로 생성해 Redis에 TTL 저장 후, 콜백에서 provider 일치 검증·삭제(`auth_router.py:290,319-325`). 정상 구현이다.
- RBAC: `require_permission(key)` dependency factory(`security.py:385-415`)로 권한 키 검증, 거부 시 403 + 로깅.
- 도메인 소유권: novel/world 도메인은 service 레이어에서 `novel.user_id != user_id` 검증을 일관되게 수행한다(`novel_router`는 service에 `current_user.id` 전달, world 5개 service 전부 `_verify_novel_ownership` 구현, `world_setting/character/location/timeline/relationship_service.py`). 누락된 도메인은 발견되지 않았다.

이 영역은 코드 근거상 견고하다.

### 3.4 draft 엔드포인트에 `require_permission` 미적용 [낮음]

`draft_router.py`의 `generate_draft`(44행)는 `get_current_user`로 인증은 하지만 `require_permission`을 사용하지 않는다(grep: draft_router 0건, chat_router 3건). novel 소유권은 직접 `novel.user_id != current_user.id`로 확인하므로(55행) 무단 접근은 막히나, chat 도메인이 LLM 사용에 `chat:write` 권한을 요구하는 것과 달리 draft(역시 LLM 호출)는 권한 게이트가 없어 RBAC 정책이 도메인 간 일관되지 않다.

### 3.5 Rate limiting — 인프라만 있고 적용 0건 [높음]

`apps/api/src/main.py:103`에서 slowapi `Limiter`를 생성하고 `application.state.limiter`에 등록하며 `RateLimitExceeded` 핸들러도 붙이지만(`main.py:122-123`), `@limiter.limit(...)` 데코레이터가 **코드 전체에서 0건**이다(grep 결과 없음).

왜 문제인가: 로그인·회원가입·OAuth·LLM 초안/채팅 등 비용·남용 민감 엔드포인트 어디에도 실제 rate limit이 걸려 있지 않다. 브루트포스 로그인과 LLM 비용 폭주(과금 공격)에 무방비다. 인프라는 완비되어 있으나 정책이 미적용 상태다.

### 3.6 입력 검증 — 양호 [높음]

요청 본문은 Pydantic 모델로 검증된다(`DraftRequest`, `ContextItem`의 `Literal`/`UUID` 타입 강제 등, `draft_router.py:34-41`). 경로의 `novel_id`/`chapter_id`는 `uuid.UUID` 타입으로 받아 자동 파싱·검증된다. SQL은 전부 SQLAlchemy ORM/`select`를 통하므로 인젝션 표면이 작다. `.env`/`.env.prod`는 `.gitignore`로 추적 제외되고 `.env.example`/`.env.prod.example` 템플릿만 커밋되어 있다(실제 시크릿 미커밋 확인됨).

## 4. 성능 (Performance)

### 4.1 LLM 클라이언트 매 요청 재생성 [중간]

`apps/api/src/domains/chat/llm_client.py:318-358`, `DefaultLLMClientFactory.get_llm_client()`(408행)와 `provider_factory.make_chat_litellm`은 **요청마다 `ChatLiteLLM`을 새로 인스턴스화**한다(주석에 "fresh per-request"라고 명시, 테스트의 env 변경 반영 목적). provider 클라이언트 생성·내부 connection 설정 비용이 매 요청 반복된다. 프로덕션에서는 캐싱이 바람직하나 현재는 의도적 트레이드오프다.

### 4.2 draft 컨텍스트 N+1 — 위 2.3 참조 [중간]

`draft_router.py:71-94`의 순차 `get_by_id` 루프.

### 4.3 인덱스 커버리지 — 양호 [높음]

모든 FK 컬럼(`novel_id` 등)에 인덱스가 부여되어 있다: `ix_characters_novel_id`, `ix_locations_novel_id`, `ix_world_settings_novel_id`, `ix_timelines_novel_id`, `ix_character_relationships_novel_id`(`0005_world_domain.py:60,90,136,168,211`), `ix_story_beats_novel_id`(`0006_story_beats.py:63`). auth 모델은 `email`/`jti`/`token_hash`/`family_id`/`replaced_by_jti` 등에 unique/index 부여(`auth_models.py:150,221,222,226,229`), chat 모델도 인덱스 보유(`chat_models.py:49,99`). novel별 조회 위주 워크로드에 대해 인덱스가 잘 깔려 있어 명백한 누락 인덱스는 보이지 않는다.

### 4.4 블로킹 호출 — 발견되지 않음 [중간]

async 경로 내 명백한 동기 블로킹 I/O(예: 동기 DB 드라이버, `time.sleep`, 동기 HTTP)는 발견되지 않았다. DB는 asyncpg, OAuth HTTP는 `httpx.AsyncClient`(`google.py:66`), Redis는 async client를 사용한다. argon2 해싱(`hash_password`, `security.py:76`)은 CPU 바운드 동기 호출이라 이론상 이벤트 루프를 점유하나, 로그인/회원가입 경로에 국한되고 빈도가 낮아 실질 위험은 작다.

## 5. 마이그레이션 / 스키마 위험 (Migration / Schema)

### 5.1 단일 head — 정상 [높음]

`apps/api/alembic/versions/`에 7개 revision(0001~0007) + 빈 .gitkeep. `down_revision`이 없는 파일은 `0001_initial_schema.py`(initial)뿐이며(grep `-L` 결과), 체인은 `0001 → 0002,0003 → 0004(merge) → 0005 → 0006 → 0007`로 단일 head로 수렴한다. 미해결 다중 head는 없다. merge migration은 `0004` 하나로, 0002(seed)와 0003(novel)의 분기를 정상 병합한다.

### 5.2 PostgreSQL ENUM 다운그레이드 취약성 [낮음]

`0005_world_domain.py`는 `CREATE TYPE ... ENUM`을 raw SQL로 생성하고(21-28행), 다운그레이드에서 `DROP TYPE`(225-226행)한다. ENUM에 의존하는 컬럼이 남아있으면 `DROP TYPE`이 실패하는데, 다운그레이드는 테이블을 먼저 drop하므로 현재 순서상은 안전하다. `0006_story_beats.py`는 `DO $$ ... EXCEPTION WHEN duplicate_object`로 멱등 생성(22-27행)을 쓰지만, `0005`는 멱등 가드가 없어 부분 적용 후 재실행 시 "type already exists"로 실패할 수 있다. 마이그레이션 간 ENUM 생성 패턴이 일관되지 않다.

### 5.3 `server_default`로 NOT NULL 컬럼 추가 — 안전 [높음]

`0007_novel_tagline_tags.py`는 `tags` JSONB NOT NULL 컬럼을 `server_default='[]'::jsonb`와 함께 추가(22-30행)하여 기존 행 백필이 보장된다. `tagline`은 nullable. 안전한 패턴이다.

## 요약 (우선순위)

높은 우선순위로 다룰 만한 실질 위험 4가지:

1. **Rate limiting 미적용**(3.5) — 인프라만 있고 정책 0건. 브루트포스·LLM 과금 공격에 무방비.
2. **`localStorage` 토큰 저장**(3.1) — refresh 토큰까지 XSS 노출.
3. **LLM 재시도 로직 부재**(1.2) — `tenacity` 선언만 하고 미사용, transient 오류 직접 전파.
4. **production 시크릿 기본값 가드 부재**(3.2) — 기본 JWT 키로 배포 가능.

그 외 인증/인가 코어, 입력 검증, 인덱스 커버리지, 마이그레이션 체인은 코드 근거상 견고하다. TODO/FIXME 마커 기준 부채도 3건으로 매우 적다.
