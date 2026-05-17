---
name: warn-sqlalchemy-async-lazy-load
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.py$
  - field: new_text
    operator: regex_match
    pattern: user\.(roles|permissions|[a-z_]+s)\b|obj\.(roles|permissions)\b
---

⚠️ **SQLAlchemy async lazy load 위험**

async SQLAlchemy 컨텍스트에서 relationship 속성에 직접 접근하면 `MissingGreenlet` 에러가 발생합니다.

**원인:** `session.add()` 또는 `create_user()` 후 반환된 객체는 relationship이 로드되지 않은 상태입니다.

**해결 방법:**
```python
# ❌ 잘못된 예
if role not in user.roles:
    user.roles.append(role)

# ✅ 올바른 예
await session.refresh(user, attribute_names=["roles"])
if role not in user.roles:
    user.roles.append(role)
```

또는 쿼리 시점에 `selectinload`로 eager loading:
```python
select(User).options(selectinload(User.roles))
```
