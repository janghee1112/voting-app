# Spec: 투표 마감 + 결과 그래프

**Status:** ready-for-agent

## Problem Statement

투표가 계속 열려 있어서 구성원들이 "나중에 하지" 하고 참여를 미룬다. 결과도 숫자 목록뿐이라 어떤 선택지가 앞서는지 한눈에 들어오지 않는다.

## Solution

투표 생성자가 투표를 만들 때 마감 시각(Closes At)을 선택으로 정할 수 있다. 마감 시각이 지나면 투표하기 화면의 버튼이 비활성화되고 "마감된 투표입니다" 안내가 보이며, 서버도 표를 거부한다. 결과 화면은 선택지별 퍼센트 막대그래프와 총 투표 수를 보여준다.

## User Stories

1. As a 투표 생성자, I want to 마감 시각을 선택으로 입력하고 싶다, so that 참여 기한을 알릴 수 있다
2. As a 투표 생성자, I want to 마감 시각을 비워두면 기존처럼 무기한 투표가 되길 원한다, so that 급하지 않은 투표는 그대로 쓴다
3. As a 투표 생성자, I want to 이미 지난 시각을 마감으로 넣으면 막히길 원한다, so that 만들자마자 닫힌 투표가 생기지 않는다
4. As a 투표자, I want to 투표하기 화면에서 마감 시각을 보고 싶다, so that 언제까지 참여해야 하는지 안다
5. As a 투표자, I want to 목록에서도 마감 시각이나 "마감" 표시를 보고 싶다, so that 참여할 수 있는 투표를 고른다
6. As a 투표자, I want to 마감된 투표에서는 버튼이 비활성화되고 "마감된 투표입니다" 안내를 보고 싶다, so that 헛수고하지 않는다
7. As a 투표자, I want to 마감 직전에 화면을 열어둔 채 제출하면 "마감되었다"는 이유를 보고 싶다, so that 표가 왜 안 들어갔는지 안다
8. As a 투표 생성자, I want to 마감 후에는 API를 직접 불러도 표가 안 들어가길 원한다, so that 결과를 믿을 수 있다
9. As a 투표자, I want to 마감된 투표의 결과는 계속 보고 싶다, so that 최종 결과를 확인한다
10. As a 투표자, I want to 결과를 선택지별 퍼센트 막대그래프로 보고 싶다, so that 차이를 한눈에 본다
11. As a 투표자, I want to 막대 옆에 득표수와 퍼센트 숫자도 보고 싶다, so that 정확한 값을 안다
12. As a 투표자, I want to 가장 많이 받은 선택지가 강조되길 원한다, so that 1등을 바로 안다
13. As a 투표자, I want to 표가 0개인 투표 결과에서 "아직 투표가 없어요" 안내와 0% 막대를 보고 싶다, so that 에러 없이 상태를 안다
14. As a 투표자, I want to 기존(마감 없는) 투표도 그대로 투표·결과 보기가 되길 원한다, so that 이전 투표가 망가지지 않는다

## Implementation Decisions

- **스키마 마이그레이션**: `alter table polls add column if not exists closes_at timestamptz;` (nullable). `db/schema.sql` 끝에 추가해 `npm run db:init` 한 번으로 새 DB·기존 DB 모두 적용된다.
- **투표 모듈** 변경:
  - `createPoll` 입력에 선택값 `closesAt`(ISO 문자열 또는 없음). 형식이 틀리거나 현재보다 이전이면 ValidationError.
  - `PollSummary`에 `closesAt: string | null`, `isClosed: boolean` 추가. `isClosed`는 DB의 `now()` 기준으로 계산.
  - `castVote` 반환값을 `"ok" | "not_found" | "closed"`로 바꾼다. 마감 판정은 득표수를 올리는 같은 SQL 문장 안에서 한다(ADR-0003).
- **API**: `POST /api/polls` body에 `closesAt?`. `POST /api/polls/[id]/vote`는 마감이면 409 `{ error: "마감된 투표입니다." }`.
- **화면**: 생성 폼에 `datetime-local` 입력(선택). 투표하기 화면에 마감 시각 표시, 마감이면 버튼 비활성화 + 안내. 결과 화면은 막대그래프 컴포넌트로 교체(단색 막대 + 1등 강조, 색 구분에 의존하지 않음).
- 퍼센트는 기존과 같이 정수 반올림(합이 100이 아닐 수 있음).

## Testing Decisions

- seam은 기존과 같은 투표 모듈 하나. PGlite 테스트에서 마감 시각을 과거로 직접 바꿀 수 없으므로(생성 시 과거 금지), 테스트 전용 DB 조작 없이 "짧은 미래 마감 후 대기"도 느리다 — 대신 테스트는 DB 어댑터로 `closes_at`을 과거로 업데이트하는 준비 단계를 쓴다(검증 대상은 여전히 공개 함수의 반환값).
- 막대그래프 컴포넌트는 표시 전용이라 자동 테스트 없이 브라우저로 확인한다(퍼센트 계산은 이미 투표 모듈 테스트가 덮는다).

## Out of Scope

- 마감 시각 수정·연장, 수동 마감 버튼
- 마감 알림, 실시간 갱신
- 파이 차트 등 다른 그래프, 차트 라이브러리 도입
- 중복 투표 방지(ADR-0001 유지)

## Further Notes

- 배포는 Vercel. 배포 전에 Neon에 마이그레이션(`npm run db:init`)을 먼저 적용한다.
