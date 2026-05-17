---
phase: quick
plan: 260517-pse
type: execute
wave: 1
depends_on: []
files_modified:
  - Taskfile.yml
  - apps/api/Taskfile.yml
autonomous: true
requirements: []
must_haves:
  truths:
    - "프로젝트 루트에서 `task dev` 한 번으로 API + 웹 프론트엔드를 동시에 띄울 수 있다"
    - "`task api:test`, `task web:lint` 등 네임스페이스 명령이 작동한다"
    - "`task` (인자 없음) 실행 시 사용 가능한 태스크 목록이 출력된다"
  artifacts:
    - path: "Taskfile.yml"
      provides: "루트 태스크파일 — api:*, web:*, db:* 네임스페이스 + 최상위 dev/lint/test 집계 태스크"
    - path: "apps/api/Taskfile.yml"
      provides: "PROJECT 변수가 storywriter-studio-api로 수정됨"
  key_links:
    - from: "Taskfile.yml"
      to: "apps/api/Taskfile.yml"
      via: "taskfile includes (dir: apps/api)"
      pattern: "includes:"
---

<objective>
프로젝트 루트에 Taskfile.yml을 생성하여 모노레포 전체 워크플로우를 단일 진입점으로 통합한다.

Purpose: 현재 apps/api/에만 Taskfile.yml이 존재하고 루트에는 없어서, 매번 디렉터리를 이동하며 명령어를 실행해야 한다. 루트 Taskfile이 api:, web:, db: 네임스페이스로 두 앱을 묶으면 개발 마찰이 크게 줄어든다.

Output:
- Taskfile.yml (루트, 신규 생성)
- apps/api/Taskfile.yml (PROJECT 변수 수정만)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/gyuha/workspace/storywriter-studio/apps/api/Taskfile.yml
@/Users/gyuha/workspace/storywriter-studio/apps/web/package.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: 루트 Taskfile.yml 생성 및 apps/api/Taskfile.yml PROJECT 변수 수정</name>
  <files>
    Taskfile.yml
    apps/api/Taskfile.yml
  </files>
  <action>
루트에 Taskfile.yml을 생성한다. Taskfile v3 형식을 사용하며 apps/api/Taskfile.yml을 `includes`로 가져온다.

**루트 Taskfile.yml 구조:**

```
version: "3"

includes:
  api:
    taskfile: apps/api/Taskfile.yml
    dir: apps/api

vars:
  WEB_DIR: apps/web

tasks:
  default: → task --list
  dev: → api:infra + api:migrate 의존 후 API 서버와 웹 개발서버를 병렬 실행
  api:dev → api Taskfile의 serve 호출 (infra/migrate는 이미 dev deps로 처리)
  web:dev → cd apps/web && pnpm dev
  web:build → cd apps/web && pnpm build
  web:typecheck → cd apps/web && pnpm typecheck
  web:lint → cd apps/web && pnpm lint
  web:lint:fix → cd apps/web && pnpm lint:fix
  lint → api:lint + web:lint 순차 실행
  test → api:test 실행 (웹은 현재 테스트 없음, 주석으로 명시)
  build → web:build 실행
```

**중요 구현 규칙:**
- `dev` 태스크: `deps: [api:infra, api:migrate]` 설정 후 `cmds`에서 백그라운드로 API 서버(`task api:serve &`)를 띄운 뒤 웹 개발서버(`pnpm --dir apps/web dev`)를 포그라운드로 실행. Ctrl+C 시 두 프로세스 모두 종료되도록 `trap` 또는 `wait` 사용 불필요 — pnpm dev가 포그라운드이므로 종료하면 백그라운드 API도 쉘 종료 시 정리됨.
- includes의 `dir: apps/api` 설정이 핵심 — api: 네임스페이스 태스크들이 apps/api/ 기준으로 실행됨.
- `api:dev`는 루트 Taskfile에서 별도로 정의하지 않아도 됨 — includes가 자동으로 `api:serve`, `api:dev`, `api:test` 등 모든 api Taskfile 태스크를 `api:` 접두어로 노출함.
- 루트 레벨 집계 태스크(`lint`, `test`, `build`)는 api:, web: 하위 태스크를 명시적으로 호출.

**apps/api/Taskfile.yml 수정 (최소한):**
- `vars.PROJECT` 값을 `fastapi-bootstrap`에서 `storywriter-studio-api`로 변경.
- 다른 내용은 건드리지 않음.
  </action>
  <verify>
    <automated>cd /Users/gyuha/workspace/storywriter-studio && task --list 2>&1 | head -30</automated>
  </verify>
  <done>
- 루트에서 `task --list` 실행 시 dev, lint, test, build, api:*, web:* 태스크들이 출력됨
- `task web:lint` 실행 시 apps/web에서 biome check가 실행됨
- `task api:test` 실행 시 apps/api에서 pytest가 실행됨
- apps/api/Taskfile.yml의 PROJECT 변수가 storywriter-studio-api로 변경됨
  </done>
</task>

</tasks>

<threat_model>
해당 없음 — Taskfile은 개발 도구 설정 파일로 신뢰 경계가 없다. 실행 명령은 기존 package.json scripts / pyproject.toml에 이미 정의된 것과 동일하다.
</threat_model>

<verification>
루트 디렉터리에서 순서대로 실행:

1. `task --list` → 태스크 목록 출력 확인
2. `task web:typecheck` → TypeScript 타입 체크 통과 확인
3. `task web:lint` → Biome lint 실행 확인
4. `task api:lint` → ruff + mypy 실행 확인 (infra 없어도 lint는 가능)
</verification>

<success_criteria>
- 루트 Taskfile.yml 파일이 존재한다
- `task --list`가 api:*, web:*, db:* 네임스페이스 태스크를 포함한 목록을 출력한다
- `task web:lint`와 `task api:lint`가 각각 정상 실행된다
- apps/api/Taskfile.yml의 PROJECT 변수가 storywriter-studio-api이다
</success_criteria>

<output>
완료 후 `.planning/quick/260517-pse-taskfile-yml/260517-pse-SUMMARY.md` 생성
</output>
