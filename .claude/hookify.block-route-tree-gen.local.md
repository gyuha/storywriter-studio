---
name: block-route-tree-gen
enabled: true
event: file
action: block
conditions:
  - field: file_path
    operator: ends_with
    pattern: routeTree.gen.ts
---

🚫 **자동 생성 파일 수정 금지**

`routeTree.gen.ts`는 TanStack Router가 자동으로 생성하는 파일입니다. 직접 수정하면 다음 빌드 시 덮어써집니다.

**올바른 방법:**
- 라우트를 추가/변경하려면 `apps/web/src/routes/` 디렉토리에 라우트 파일을 생성/수정하세요.
- `routeTree.gen.ts`는 `pnpm dev` 또는 `pnpm build` 실행 시 자동으로 재생성됩니다.
