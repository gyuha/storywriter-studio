---
name: warn-api-error-detail-cast
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(ts|tsx)$
  - field: new_text
    operator: regex_match
    pattern: detail\?\s+as\s+string|new Error\(.*detail
---

⚠️ **API 에러 detail 타입 미검증**

FastAPI는 422 Validation Error 시 `detail`을 **배열**로 반환합니다:
```json
{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }
```

`detail as string` 또는 `new Error(detail)` 패턴은 배열이 들어올 경우 **"[object Object]"** 를 화면에 노출합니다.

**올바른 처리:**
```typescript
function throwOnError(error: unknown, fallback: string): never {
  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') throw new Error(detail);
  if (Array.isArray(detail)) {
    const msg = (detail[0] as { msg?: string } | undefined)?.msg;
    throw new Error(msg ?? fallback);
  }
  throw new Error(fallback);
}
```
