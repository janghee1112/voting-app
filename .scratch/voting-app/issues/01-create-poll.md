# 01: DB 스키마 + 투표 만들기

**What to build:** 투표 생성자가 `/new`에서 질문과 선택지 2~5개를 입력해 투표를 만들고, 만든 투표가 `/` 목록 맨 위에 보인다. 스키마 SQL과 Neon에 테이블을 만드는 명령, 투표 모듈의 테스트 하네스(PGlite)가 이 티켓에서 함께 생긴다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] `polls`, `options`(position 포함) 스키마 SQL이 있고 `npm run db:init`로 Neon에 생성된다
- [x] 질문·선택지를 공백 정리 후 저장하고 id를 돌려준다
- [x] 빈 질문, 선택지 2개 미만/5개 초과, 빈 선택지, 중복 선택지는 거부된다
- [x] `POST /api/polls`가 201 `{ id }` / 400 `{ error }`를 돌려준다
- [x] `/` 는 최신순 목록과 빈 상태 안내, `/new` 는 입력 폼(칸 추가·삭제)과 에러 표시를 보여준다
- [x] 생성 후 `/polls/[id]`로 이동한다

## Comments

- 구현 완료. `npm test` 18개 통과, 로컬 API/페이지 스모크 테스트 통과.
