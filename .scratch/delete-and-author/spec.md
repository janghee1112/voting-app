# Spec: 투표 삭제(운영자) + 화면에 만든 사람 이름

**Status:** ready-for-agent

## Problem Statement

테스트로 만든 투표나 잘못 만든 투표를 지울 방법이 없다. 또 과제 요구사항으로 앱 화면에 만든 사람(이장희)의 이름이 보여야 한다.

## Solution

운영자가 투표하기 화면 아래의 "투표 삭제"에서 운영자 비밀번호를 입력하면 그 투표가 선택지·득표수와 함께 삭제되고 목록으로 돌아간다. 모든 화면의 머리글과 바닥글에 만든 사람 이름을 표시한다.

## User Stories

1. As a 운영자, I want to 투표하기 화면에서 삭제를 시작하고 싶다, so that 지울 투표를 보면서 지운다
2. As a 운영자, I want to 삭제 전에 비밀번호 입력과 한 번 더 누르는 확인 단계를 거치고 싶다, so that 실수로 지우지 않는다
3. As a 운영자, I want to 올바른 비밀번호로 삭제하면 목록으로 돌아가고 그 투표가 사라지길 원한다, so that 삭제됐음을 바로 안다
4. As a 운영자, I want to 비밀번호가 틀리면 이유를 보고 싶다, so that 다시 입력할 수 있다
5. As a 투표자, I want to 비밀번호 없이는 API로도 삭제할 수 없길 원한다, so that 남이 투표를 지우지 못한다
6. As a 운영자, I want to 삭제된 투표의 주소로 들어가면 "찾을 수 없음"이 보이길 원한다, so that 링크가 끝났음을 안다
7. As a 방문자, I want to 모든 화면에서 이 앱을 만든 사람의 이름을 보고 싶다, so that 누구의 과제인지 안다

## Implementation Decisions

- 투표 모듈에 `deletePoll(db, pollId) → boolean` 추가(없거나 잘못된 id면 false). 선택지는 기존 `on delete cascade`로 함께 삭제.
- 비밀번호 확인은 작은 순수 함수 `isOperatorPassword(입력, 설정값)`: 설정값이 비어 있으면 항상 false, 비교는 길이 차이를 드러내지 않는 상수 시간 비교(ADR-0004).
- API: `DELETE /api/polls/[id]` body `{ password }` → 200 `{ ok: true }` / 401 틀린 비밀번호 / 404 없는 투표 / 503 서버에 비밀번호 미설정.
- 화면: 투표하기 화면 아래 "투표 삭제(운영자)" 버튼 → 비밀번호 칸 + "정말 삭제" 버튼(브라우저 confirm 창 대신 화면 안 2단계). 성공 시 목록으로 이동.
- 이름: 머리글 앱 이름 옆과 바닥글에 "만든 사람: 이장희".
- 환경변수 `ADMIN_PASSWORD`를 `.env.local`과 Vercel에 추가.

## Testing Decisions

- seam: 투표 모듈(`deletePoll`)과 비밀번호 확인 함수. 둘 다 공개 함수의 반환값만 본다.
- 삭제 후 `getPoll`·`listPolls`로 사라졌는지, 다른 투표는 남아 있는지 확인.

## Out of Scope

- 운영자 로그인·세션, 여러 운영자 계정, 삭제 기록, 되돌리기, 투표 수정

## Further Notes

- 배포 후 Vercel에 `ADMIN_PASSWORD`를 넣고 재배포해야 삭제가 동작한다.
