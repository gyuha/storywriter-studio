---
name: warn-openapi-ts-format-false
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: openapi-ts\.config\.(ts|js|mjs)$
  - field: new_text
    operator: regex_match
    pattern: format:\s*false
---

⚠️ **openapi-ts config: `format: false` 유효하지 않음**

`@hey-api/openapi-ts` v0.97+에서 `format: false`는 유효한 값이 아닙니다.

**올바른 값:**
```typescript
output: {
  path: './src/generated',
  format: null,  // ← false가 아닌 null
}
```

포맷팅을 활성화하려면 `'prettier'` 또는 `'biome'`을 사용하세요.
