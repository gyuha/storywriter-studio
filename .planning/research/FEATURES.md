# Feature Landscape

**Domain:** AI 기반 웹소설 집필 보조 플랫폼
**Researched:** 2026-05-17

---

## Table Stakes

사용자가 기대하는 기본 기능. 없으면 제품이 미완성으로 느껴짐.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 챕터(회차) 에디터 — 리치 텍스트 | 모든 집필 도구의 기본 (Scrivener, Atticus, Muvel 모두 제공) | Medium | TipTap 또는 Lexical; 한국어 폰트·줄간격 조절 필수 |
| 글자 수 카운터 (회차 단위) | 한국 웹소설 유료 연재 기준이 회차당 5,000-5,500자. 목표 달성 여부 실시간 확인 없이는 불편 | Low | 플랫폼별 기준치를 preset으로 제공하면 차별화 가능 |
| 프로젝트 단위 소설 관리 | 소설 여러 편 동시 작업하는 작가가 많음 | Low | 프로젝트 생성/수정/삭제, 목록 |
| 챕터 순서 관리 및 상태 관리 | 초안/완성 구분, 순서 변경 없이는 연재 관리 불가 | Low | drag-and-drop 순서 변경, 상태 레이블(초안/검토/완성) |
| 캐릭터 데이터베이스 | 모든 경쟁 도구(Novelcrafter Codex, Sudowrite Story Bible, Scrivener) 제공. 없으면 설정 일관성 깨짐 | Medium | 이름, 별칭, 외형, 성격, 관계, 등장 챕터 추적 |
| 장소/배경 데이터베이스 | 캐릭터 DB와 동급 기대치 | Low | 이름, 설명, 위치 관계 |
| 세계관 설정 데이터베이스 | 판타지·무협·SF 장르 작가의 필수 도구 | Medium | 매직체계, 국가/세력, 역사, 규칙 등 자유 형식 항목 |
| AI 초안 생성 (챕터 단위) | AI 집필 보조 플랫폼의 존재 이유 자체 | High | 설정 컨텍스트 자동 주입이 핵심 (아래 AI 컨텍스트 주입 참조) |
| 맞춤법 검사기 (한국어) | 한국 작가 1순위 요구사항. 부산대 맞춤법 검사기가 신뢰도 기준 | Medium | 외부 API 연동 (부산대 or 네이버 맞춤법 검사기); 자체 구현 불필요 |
| 자동 저장 / 버전 이력 | 데이터 손실 = 즉시 이탈. Muvel은 10분마다 스냅샷 | Low | Auto-save + 최근 N개 버전 복원 |
| 다중 AI 모델 선택 | LiteLLM 인프라 이미 있음. Claude/GPT 선택 없으면 경쟁 도구 대비 열위 | Medium | 이미 인프라 존재, UI 선택기 추가 |
| 반응형 웹 UI (PC 중심) | 웹소설 작가는 주로 PC 작업. 모바일 미지원 허용되나 PC UX 완성도는 필수 | Low | 모바일 앱은 Out of Scope, 반응형은 기본 |

---

## Differentiators

경쟁 우위를 만드는 기능. 기대치는 낮지만 있으면 높은 가치를 인정받음.

### AI 컨텍스트 자동 주입 (핵심 차별화)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 챕터 작성 시 관련 캐릭터·장소·설정 자동 추출하여 시스템 프롬프트 삽입 | Novelcrafter의 Codex 방식. 작가가 프롬프트를 매번 작성할 필요 없음. 세계관 일관성의 핵심 | High | 챕터 내 멘션 감지 → 관련 Codex 항목 자동 선택 → 시스템 프롬프트에 삽입 |
| 사이드패널 컨텍스트 뷰어 (수동 제어) | 자동 주입과 병행: 작가가 직접 특정 캐릭터/설정을 AI 컨텍스트에 추가/제거 | Medium | Novelcrafter의 "+ Codex" 버튼 패턴; 현재 챕터에 관련된 항목만 필터링 표시 |
| 이전 챕터 요약 컨텍스트 | Smart Continue 패턴: AI 생성 시 이전 2-3 챕터 내용을 자동으로 컨텍스트에 포함. 연속성 유지 | High | LLM context window 한계 고려. 전체 챕터가 아닌 요약 주입이 현실적 |
| 컨텍스트 프리뷰 (전송 전 확인) | 어떤 정보가 AI에 전달되는지 작가가 볼 수 있음. Novelcrafter 제공 기능. 신뢰도 상승 | Medium | 프롬프트 미리보기 모달 또는 사이드패널 탭 |

### 세계관 관리 고급 기능

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 캐릭터 관계 그래프 (인간관계 맵) | Novelcrafter의 Relations 기능. 복잡한 군상극에서 관계 추적 | High | vis.js 또는 react-flow로 시각화. 초기에는 텍스트 관계 목록도 충분 |
| 설정 항목 간 관계 연결 (장소-캐릭터, 세력-캐릭터) | 관계 설정 시 AI 컨텍스트에 연관 항목 자동 포함 | High | Novelcrafter의 relation-based context injection 패턴 |
| 연표/타임라인 (사건-챕터 연결) | 장편 연재에서 시간 순서 오류 방지. 플롯 빌더와 연동 | Medium | 초반에는 간단한 사건 목록 + 챕터 연결로 충분 |
| 스토리 비트 / 플롯 구조 관리 | Sudowrite의 Scenes/Beats 기능. 챕터 작성 전 개요 구성 | Medium | 전체 플롯 → 아크 → 챕터 비트 계층 구조 |
| 캐릭터 progression 추적 | Novelcrafter 기능: 캐릭터가 챕터마다 어떻게 변화했는지 기록 | Medium | 1인칭 성장물이 많은 웹소설 장르에 유효 |

### 한국 웹소설 특화 기능

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 회차별 글자 수 목표 설정 및 추적 | 카카오페이지/네이버 시리즈 기준 5,000-5,500자 preset. 현재 달성률 실시간 표시 | Low | 플랫폼별 preset + 커스텀 목표 설정 |
| 연재 일정 캘린더 / 업로드 계획 | 정기 연재 중인 작가의 일정 관리 (경쟁 도구 대부분 미제공) | Medium | 간단한 캘린더 뷰: 목표 날짜 + 완성 여부 체크 |
| HWP 또는 TXT 내보내기 | 한국 출판사가 hwp 또는 txt 파일을 요구함. 현재 경쟁 도구들이 이를 지원하지 않음 | Medium | hwp는 복잡 (라이선스 이슈); txt + 한국어 인코딩 우선 지원 |
| 플랫폼 스타일 미리보기 | 네이버 시리즈/카카오페이지 스타일로 글이 어떻게 보일지 미리보기 | Low | CSS 스타일 시뮬레이션. Muvel이 제공하는 기능 |

### UX 차별화

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| 분할 화면 (에디터 + 사이드패널 동시) | 글 쓰면서 설정 참조. 현재 작업 흐름을 끊지 않음 | Low | 고정 사이드패널 또는 리사이저블 패널. Muvel 위젯 시스템 참조 |
| AI 생성 결과 인라인 삽입 | 생성된 텍스트를 에디터에 직접 삽입/비교. 외부 탭 이동 없이 워크플로우 유지 | Medium | diff 뷰 또는 "수락/거부" 버튼 패턴 |
| 집필 통계 대시보드 | 일별·주별 글자 수 추적, 목표 달성률. 동기 부여 도구 | Low | 간단한 차트면 충분 |

---

## Anti-Features

의도적으로 빌드하지 말아야 할 기능.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| 실시간 공동 집필 (다중 사용자 동시 편집) | 웹소설은 거의 단독 작업. 복잡도만 폭발적으로 증가 (Operational Transform/CRDT 필요). 이미 Out of Scope 결정 | 공유 링크로 읽기 전용 공유만 지원 |
| 이미지/일러스트 생성 | 텍스트 집필 집중이 핵심 가치. AI 이미지 생성은 완전히 다른 인프라와 복잡도 | 텍스트 전용 유지. 캐릭터 시트에 이미지 업로드(외부 생성 후)만 허용 |
| AI 탐지 우회 기능 | 법적·윤리적 리스크. 플랫폼 이용약관 위반 가능성 | 해당 기능 없음 |
| 소셜 기능 (팔로우, 댓글, 공개 피드) | 집필 도구가 SNS화되면 핵심 가치 희석. 작가들이 가장 싫어하는 기능 패턴 | 공유는 프로젝트 링크 수준으로 제한 |
| 출판/연재 플랫폼 직접 업로드 연동 | 각 플랫폼 API 정책이 다르고 불안정. v1 범위 초과. 이미 Out of Scope 결정 | 내보내기 (txt/복사) → 수동 업로드로 충분 |
| 자동 완성 (AI가 다음 문장 추천) | 글 쓰는 중 AI 제안 팝업은 작가의 집중을 방해. 대부분의 작가가 끄는 기능 | 명시적 "AI 생성" 버튼으로만 AI 호출 (pull, not push) |
| 복잡한 마케팅 도구 (책 소개, 커버 생성, SNS 포스팅) | 집필 보조 범위 초과. 비용 대비 가치 낮음 | 집필 완성에 집중 |
| 오프라인 모드 (풀 로컬 동기화) | PWA/Electron 수준의 복잡도. 클라우드 우선이 현재 아키텍처와 일치 | 자동 저장 + 연결 복구 UX로 충분 |

---

## Feature Dependencies

기능 간 의존 관계. 구현 순서 결정에 사용.

```
프로젝트 관리
  └→ 챕터 관리 (프로젝트가 있어야 챕터 존재)
       └→ 챕터 에디터 (챕터가 있어야 편집 가능)
            └→ AI 초안 생성 (에디터 없이 생성 결과 배치 불가)
                  └→ 컨텍스트 자동 주입 (캐릭터/설정 DB가 있어야 주입 가능)

캐릭터 DB
  └→ 장소 DB         ─→ 세계관 설정 DB (병렬 구축 가능)
       └→ 관계 그래프 (캐릭터 DB 기반)
            └→ 컨텍스트 자동 주입 (관계 기반 연관 항목 포함)

글자 수 카운터 → 회차 글자 수 목표 → 연재 일정 캘린더
맞춤법 검사기 (독립 기능, 에디터에 통합)
스토리 비트 → 챕터 비트 → AI 초안 생성 (비트를 컨텍스트로 사용)
```

---

## MVP Recommendation

빠른 가치 검증을 위한 우선순위.

**빌드 순서:**

1. 프로젝트 + 챕터 CRUD + 리치 텍스트 에디터 (글자 수 카운터 포함)
   - 이것만 있어도 기존 한글/구글독스 대비 구조화된 관리 가능
2. 캐릭터/장소/세계관 DB (기본 CRUD)
   - 설정 데이터가 있어야 AI 컨텍스트 주입이 의미 있음
3. AI 초안 생성 + 사이드패널 컨텍스트 주입
   - 핵심 가치 실현. 이 단계에서 첫 실제 사용자 테스트 가능
4. 맞춤법 검사기 통합
   - 한국 작가 이탈 방지용
5. 연표/관계 그래프/스토리 비트
   - 고급 사용자 유지를 위한 기능

**Defer:**
- 연재 일정 캘린더: 유용하지만 집필 핵심 가치와 거리 있음. 3단계 이후
- HWP 내보내기: 기술적 복잡도 대비 TXT 내보내기로 단기 대응 가능
- 집필 통계 대시보드: 있으면 좋지만 핵심 가치 아님
- 플랫폼 스타일 미리보기: 낮은 우선순위

---

## Sources

- Novelcrafter 기능 페이지: https://www.novelcrafter.com/features
- Novelcrafter Codex 문서: https://docs.novelcrafter.com/en/articles/9459585-other-ways-to-use-the-codex
- Sudowrite Story Bible 문서: https://docs.sudowrite.com/using-sudowrite/1ow1qkGqof9rtcyGnrWUBS/what-is-story-bible/jmWepHcQdJetNrE991fjJC
- 웹소설 작가 프로그램 추천 (TypeTak): https://www.typetak.com/ko/blog/webnovel_program
- 웹소설 집필 프로그램 비교 2026 (Pensiv): https://pensiv.so/ko/blog/writing-program-comparison
- Muvel 웹소설 작가용 도구: https://muvel.app/
- Best AI Fiction Tools 2026: https://blog.mylifenote.ai/the-11-best-ai-tools-for-writing-fiction-in-2026/
- AI Novel Continuity Checking: https://www.inkfluenceai.com/blog/best-ai-novel-continuity-checking-2026
- AI Writing Tools for Fiction 2026 (Laterpress): https://www.laterpress.com/craft-of-writing/best-ai-writing-tools-for-fiction/
- 웹소설 연재 분량 가이드: https://www.postype.com/@bljjakkka/post/18718072
- 한국 웹소설 시장: https://en.wikipedia.org/wiki/Web_novels_in_South_Korea
