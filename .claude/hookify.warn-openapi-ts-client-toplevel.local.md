---
name: warn-openapi-ts-client-toplevel
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: openapi-ts\.config\.(ts|js|mjs)$
  - field: new_text
    operator: regex_match
    pattern: ^\s*client:\s*['"]@hey-api
---

⚠️ **openapi-ts config: `client:` 최상위 키 사용 금지**

`@hey-api/openapi-ts` v0.97+에서 `client:`는 최상위 키가 **아닙니다**.
`plugins` 배열 안에 문자열로 넣어야 합니다.

**잘못된 예:**
```typescript
export default defineConfig({
  client: '@hey-api/client-fetch',  // ❌ 최상위에 사용 불가
  plugins: ['@hey-api/typescript', '@hey-api/sdk'],
});
```

**올바른 예:**
```typescript
export default defineConfig({
  plugins: [
    '@hey-api/typescript',
    '@hey-api/sdk',
    '@hey-api/client-fetch',  // ✅ plugins 배열 안에 포함
  ],
});
```
