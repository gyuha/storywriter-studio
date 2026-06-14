---
last_mapped_commit: c7938e3315a98f4acd930e6b82b54df325e8f755
mapped: 2026-06-14
---

# TESTING

테스트 프레임워크, 디렉터리 구조, 모킹 방식, 픽스처, 커버리지, 실행 방법. 백엔드(`apps/api/`)는 pytest 기반으로 완비되어 있고, 프론트엔드(`apps/web/`)는 프로덕션 테스트 러너가 없다.

## 백엔드 (`apps/api/`)

### 프레임워크

설정 출처: `apps/api/pyproject.toml` (`[tool.pytest.ini_options]`).

- `pytest` + `pytest-asyncio` (`asyncio_mode = "auto"` — `@pytest.mark.asyncio` 없이도 async 테스트 동작하나, 일부 파일은 명시적으로 `@pytest.mark.asyncio` 사용. 예: `apps/api/tests/unit/novel/test_novel_service.py`).
- `pytest-cov`로 커버리지, `anyio`는 async 헬퍼, `fakeredis`는 in-memory Redis 스텁 (의존성에 존재).
- `testpaths = ["tests"]`, `pythonpath = ["src"]`.
- 수집 규칙: `python_files = ["test_*.py", "*_test.py"]`, `python_classes = ["Test*"]`, `python_functions = ["test_*"]`.
- `filterwarnings = ["error", "ignore::DeprecationWarning", "ignore::PendingDeprecationWarning"]` — 경고를 에러로 승격 (deprecation 제외).

### 마커

`addopts`에 `--strict-markers`. 정의된 마커 (`markers`):

- `unit` — 순수 단위 테스트 (I/O 없음). 예: `apps/api/tests/test_dev_server.py`, `apps/api/tests/test_migrations.py`에서 `@pytest.mark.unit`.
- `integration` — DB / Redis를 실제로 사용. 예: `apps/api/tests/auth/test_signup_mailpit_integration.py`에서 `pytestmark = pytest.mark.integration` (모듈 전역) + `@pytest.mark.skipif(...)`로 Mailpit 미가용 시 스킵.
- `e2e` — 실행 중인 서버 대상 end-to-end.

마커는 일관 적용되어 있지 않다 — 많은 테스트가 마커 없이 작성되어 있고, `unit`/`integration`은 일부 파일에만 명시되어 있음.

### 디렉터리 구조

`apps/api/tests/` (도메인/관심사별 디렉터리, 각 디렉터리에 `__init__.py`):

```
tests/
  conftest.py                      루트 — settings_cache_clear autouse 픽스처
  test_config.py                   설정 로딩
  test_dev_server.py               앱 부트/라우트 (@pytest.mark.unit)
  test_main_runtime.py             런타임 동작
  test_migrations.py               Alembic 마이그레이션 (@pytest.mark.unit)
  auth/
    conftest.py                    FakeRedis / FakeAuthRepository / auth_service 픽스처
    test_auth_flows.py, test_login_route.py, test_signup_*.py,
    test_refresh_*.py, test_password_reset_*.py, test_verify_email_route.py,
    test_email_backend.py, test_access_token_context.py,
    test_signup_mailpit_integration.py  (integration)
  chat/
    conftest.py                    LLM 모킹 픽스처 전체
    _mocks.py                      FakeChatLiteLLM / StubLLMClient / 상수
    test_llm_client.py, test_llm_factory.py, test_ports.py,
    test_provider_routing.py, test_provider_mocks.py,
    test_api_provider_switching.py, test_di_container.py
  infra/llm/
    test_provider_factory.py
  shared/
    test_shared_domain.py
  unit/novel/
    test_novel_service.py, test_chapter_service.py
```

세 위치에 `conftest.py`: `tests/conftest.py`(루트), `tests/auth/conftest.py`, `tests/chat/conftest.py`.

### 픽스처 (conftest)

**루트** — `apps/api/tests/conftest.py`:

- `settings_cache_clear` (`autouse=True`) — 모든 테스트 전후로 `get_settings.cache_clear()` 호출. `get_settings`가 `@lru_cache(maxsize=1)`이므로 한 테스트의 `monkeypatch.setenv`가 다음 테스트로 누출되는 것을 방지.

**auth** — `apps/api/tests/auth/conftest.py` (모든 I/O를 in-memory 스텁으로 페이크, 실제 DB/Redis 미사용):

- `fake_redis` — `FakeRedis` (async `get`/`set`/`exists`/`delete`/`ping`, dict 백엔드).
- `fake_repo` — `FakeAuthRepository` (users/refresh_tokens/email_verifications/password_resets/oauth_accounts를 dict로 보관, `transaction()` async contextmanager 포함; row 객체는 `MagicMock`).
- `auth_service` — `AuthService(repo=fake_repo, redis=fake_redis)`.

**chat** — `apps/api/tests/chat/conftest.py` (LLM 모킹 인프라; 헬퍼는 `tests/chat/_mocks.py`에서 import 후 `__all__`로 재노출):

- 환경 변수 픽스처: `env_openai`, `env_ollama` — `monkeypatch.setenv`로 `LLM_PROVIDER` 등 설정.
- `LLMSettings` 픽스처: `openai_llm_settings`, `ollama_llm_settings` — env 부작용 없는 순수 객체.
- `ChatLiteLLM` 패치 픽스처: `patched_chat_litellm`(`MagicMock`), `fake_chat_litellm_openai`/`fake_chat_litellm_ollama`(`FakeChatLiteLLM` 인스턴스). 모두 `patch("infra.llm.provider_factory.ChatLiteLLM", ...)`로 네트워크 경계를 가로챔.
- `LLMClient` 픽스처: `llm_client_openai`, `llm_client_ollama` — 실제 `LLMClient`에 fake `ChatLiteLLM` 주입.
- `MagicMock` 기반: `mock_llm_client`, `mock_llm_client_openai`, `mock_llm_client_ollama` — 호출 횟수/인자 검증용 (`AsyncMock`으로 `ainvoke`/`invoke`, async generator로 `astream`/`stream`).
- 스텁 기반: `stub_llm_client`, `streaming_stub_llm_client` — 패치 없는 순수 Python `StubLLMClient`.
- `ChatService` 픽스처: `stub_chat_service`, `chat_service_openai`, `chat_service_ollama`.

### 모킹 방식

- **LLM (chat 도메인)**: `ChatLiteLLM` 경계에서만 가로챔 — 네트워크 호출을 하는 최하위 객체. 그 위(`LLMClient`, `ProviderFactory`, `ChatService`)는 실제 구현으로 테스트. `unittest.mock`의 `patch`/`MagicMock`/`AsyncMock` + 수제 `FakeChatLiteLLM`/`StubLLMClient` 혼용.
- **auth 도메인**: 실제 DB/Redis 대신 수제 in-memory 스텁(`FakeRedis`, `FakeAuthRepository`) 사용.
- **novel 도메인 단위 테스트**: 리포지토리를 `AsyncMock()`으로 대체하고 반환값을 `MagicMock(spec=Novel)`로 구성. 출처: `apps/api/tests/unit/novel/test_novel_service.py` — `repo = AsyncMock(); repo.create.return_value = novel; service = NovelService(repo)`, `pytest.raises(NotFoundError)` / `pytest.raises(ForbiddenError)`로 에러 검증, `repo.create.assert_called_once()`로 호출 검증.
- 환경 변수: `monkeypatch.setenv`/`monkeypatch.delenv` (루트 `settings_cache_clear`와 연동).
- `fakeredis`는 의존성으로 존재하나, 관측된 테스트들은 수제 `FakeRedis` 스텁을 더 많이 사용.

### 커버리지

설정 출처: `apps/api/pyproject.toml`.

- `addopts`: `--cov=src`, `--cov-report=term-missing`, `--cov-report=html:htmlcov`, `--cov-fail-under=70` — 커버리지 70% 미만이면 실패.
- `[tool.coverage.run]`: `source = ["src"]`, `branch = true`, `omit`에 `*/migrations/*`, `*/alembic/*`, `*/tests/*`.
- `[tool.coverage.report]`: `show_missing = true`. `exclude_lines`에 `pragma: no cover`, `def __repr__`, `if TYPE_CHECKING:`, `raise NotImplementedError`, `...`.

### 실행 방법

```bash
cd apps/api
uv run pytest                                       # 전체 (커버리지 포함, 70% 게이트)
uv run pytest tests/unit/auth/test_auth_service.py  # 단일 파일
uv run pytest -m unit                               # 단위 테스트만
uv run pytest -m integration                        # 통합 테스트만
```

## 프론트엔드 (`apps/web/`)

- **프로덕션 테스트 러너 없음.** `apps/web/package.json`에 vitest/jest/@testing-library/playwright 의존성이 없고, `vite.config.ts`에 test 설정도 없다. scripts에 `test` 항목 없음.
- 존재하는 `.test.ts` 파일은 모두 `apps/web/src/sample/` 아래에만 있다 (예: `src/sample/auth/sign-in-page.test.ts`, `src/sample/layout/navigation.test.ts`). `src/sample/`은 개발 참고용 UI이며 프로덕션 코드가 아니다. 이 파일들은 표준 테스트 러너가 아니라 `typescript` 컴파일러 API(`import ts from 'typescript'`)로 소스를 AST 파싱하는 형태로, 별도 러너 없이는 일반 단위 테스트로 실행되지 않는다.
- 프론트엔드 품질 게이트는 테스트가 아니라 `pnpm typecheck`(`tsc --noEmit`)와 `pnpm lint`(`biome check .`)로 구성된다.
