# 01: 마감 시각 저장 + 생성 폼 입력

**What to build:** 투표 생성자가 `/new`에서 마감 시각을 선택으로 입력하면 저장되고, 목록과 투표하기 화면에 마감 시각(또는 "마감")이 보인다. 비워두면 기존과 똑같이 무기한 투표다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] `polls.closes_at`(nullable) 마이그레이션이 `npm run db:init`로 적용된다
- [x] 마감 시각 없이 만든 투표·기존 투표는 closesAt null, isClosed false
- [x] 과거 시각·잘못된 형식은 ValidationError(400)
- [x] 생성 폼에 선택 입력칸, 목록·투표 화면에 한국 시간으로 표시

## Comments

- 구현 완료. `npm test` 23개 통과, 로컬 API/페이지 스모크 테스트(마감 전 200 → 마감 후 409) 통과.
