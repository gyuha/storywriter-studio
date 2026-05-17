---
phase: quick
plan: 260517-ncz
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/package.json
  - apps/api/pyproject.toml
autonomous: true
requirements: []

must_haves:
  truths:
    - "apps/web/package.json의 name 필드가 프로젝트 명을 반영한다"
    - "apps/api/pyproject.toml의 name 필드가 프로젝트 명을 반영한다"
  artifacts:
    - path: "apps/web/package.json"
      provides: "프론트엔드 패키지 메타데이터"
      contains: "storywriter-studio-web"
    - path: "apps/api/pyproject.toml"
      provides: "백엔드 패키지 메타데이터"
      contains: "storywriter-studio-api"
  key_links: []
---

<objective>
`apps/web/package.json`과 `apps/api/pyproject.toml`의 패키지 이름을 프로젝트 이름인 **StoryWriter Studio**에 맞게 변경한다.

Purpose: 현재 `react-bootstrap`, `fastapi-bootstrap`이라는 보일러플레이트 이름이 실제 프로젝트와 무관하여 혼란을 준다. 패키지 메타데이터를 실제 프로젝트에 정렬한다.
Output: 두 파일의 name 필드가 각각 `storywriter-studio-web`, `storywriter-studio-api`로 변경된다.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: 패키지 이름 변경</name>
  <files>apps/web/package.json, apps/api/pyproject.toml</files>
  <action>
    두 파일의 name 필드를 변경한다.

    apps/web/package.json:
    - `"name": "react-bootstrap"` → `"name": "storywriter-studio-web"`

    apps/api/pyproject.toml:
    - `name = "fastapi-bootstrap"` → `name = "storywriter-studio-api"`
    - `description` 필드도 실제 프로젝트를 반영하도록 변경:
      `"Production-grade FastAPI backend for StoryWriter Studio — AI-powered web novel writing platform."`

    두 파일 외의 다른 내용은 변경하지 않는다.
  </action>
  <verify>
    <automated>grep '"name"' /Users/gyuha/workspace/storywriter-studio/apps/web/package.json | grep storywriter-studio-web && grep '^name' /Users/gyuha/workspace/storywriter-studio/apps/api/pyproject.toml | grep storywriter-studio-api && echo "PASS"</automated>
  </verify>
  <done>
    - apps/web/package.json의 name이 "storywriter-studio-web"
    - apps/api/pyproject.toml의 name이 "storywriter-studio-api"
    - 나머지 필드는 변경 없음
  </done>
</task>

</tasks>

<verification>
변경 후 두 앱의 빌드/실행에 영향이 없음을 확인한다. package.json의 name 필드는 npm workspaces 내부 참조가 없는 한 런타임에 영향이 없고, pyproject.toml의 name은 pip install -e . 외에 런타임에 영향이 없다. 이 프로젝트는 uv로 관리되며 내부 패키지 참조가 없으므로 안전하다.
</verification>

<success_criteria>
- apps/web/package.json: `"name": "storywriter-studio-web"` 확인
- apps/api/pyproject.toml: `name = "storywriter-studio-api"` 확인
- pnpm dev, uv run uvicorn 실행에 영향 없음
</success_criteria>

<output>
완료 후 `.planning/quick/260517-ncz-app-web-app-api/260517-ncz-SUMMARY.md` 생성
</output>
