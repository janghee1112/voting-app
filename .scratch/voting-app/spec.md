# Spec: 투표 앱 MVP

**Status:** ready-for-agent

## Problem Statement

동아리 회장은 구성원들에게 "이번 MT 장소는 어디로 할까?" 같은 질문을 던지고 빠르게 의견을 모으고 싶다. 지금은 단체 채팅방에서 손으로 세고 있어서 누가 뭘 골랐는지 섞이고, 결과를 한눈에 보기 어렵다.

## Solution

누구나 질문과 선택지 2~5개로 투표(Poll)를 만들 수 있고, 투표 링크를 받은 투표자(Voter)가 선택지 하나를 골라 표(Vote)를 던지며, 결과(Results) 화면에서 선택지별 득표수와 비율을 숫자 목록으로 확인하는 웹앱. 로그인은 없다(ADR-0001).

## User Stories

1. As a 투표 생성자, I want to 질문 한 줄을 입력하고 싶다, so that 구성원에게 무엇을 묻는지 분명히 할 수 있다
2. As a 투표 생성자, I want to 선택지를 최소 2개 입력하고 싶다, so that 고를 거리가 있는 투표가 된다
3. As a 투표 생성자, I want to 선택지를 최대 5개까지 추가하고 싶다, so that 후보가 여러 개인 경우도 다룰 수 있다
4. As a 투표 생성자, I want to 필요 없는 선택지 입력칸을 지우고 싶다, so that 실수로 늘린 칸 때문에 투표가 막히지 않는다
5. As a 투표 생성자, I want to 질문이나 선택지가 비어 있으면 저장 전에 이유를 보고 싶다, so that 무엇을 고쳐야 할지 안다
6. As a 투표 생성자, I want to 똑같은 선택지를 두 번 넣으면 막히고 싶다, so that 표가 두 곳으로 갈라지지 않는다
7. As a 투표 생성자, I want to 앞뒤 공백이 자동으로 정리되길 원한다, so that "치킨"과 " 치킨 "이 다른 선택지가 되지 않는다
8. As a 투표 생성자, I want to 투표를 만든 직후 그 투표의 투표하기 화면으로 이동하고 싶다, so that 링크를 바로 복사해 공유할 수 있다
9. As a 투표 생성자, I want to 선택지가 내가 입력한 순서대로 보이길 원한다, so that 의도한 순서(예: 날짜순)가 유지된다
10. As a 투표자, I want to 첫 화면에서 전체 투표 목록을 최신순으로 보고 싶다, so that 참여할 투표를 찾을 수 있다
11. As a 투표자, I want to 투표가 하나도 없을 때 안내 문구와 만들기 링크를 보고 싶다, so that 빈 화면에 당황하지 않는다
12. As a 투표자, I want to 목록에서 투표를 눌러 투표하기 화면으로 가고 싶다, so that 바로 참여할 수 있다
13. As a 투표자, I want to 투표하기 화면에서 질문과 선택지를 보고 하나만 고르고 싶다, so that 내 의견을 표시할 수 있다
14. As a 투표자, I want to 선택지를 고르지 않으면 제출 버튼이 동작하지 않길 원한다, so that 빈 표가 들어가지 않는다
15. As a 투표자, I want to 제출하면 곧바로 결과 화면으로 이동하고 싶다, so that 내 표가 반영된 걸 확인한다
16. As a 투표자, I want to 투표하지 않고도 결과 보기 링크로 결과를 보고 싶다, so that 현재 분위기를 알 수 있다
17. As a 투표자, I want to 결과 화면에서 선택지별 득표수를 숫자로 보고 싶다, so that 무엇이 이기고 있는지 안다
18. As a 투표자, I want to 선택지별 비율(%)과 총 투표 수도 보고 싶다, so that 차이를 한눈에 가늠한다
19. As a 투표자, I want to 아직 표가 없는 투표의 결과도 0표·0%로 보고 싶다, so that 에러 대신 정상 화면을 본다
20. As a 투표자, I want to 없는 투표 주소로 들어가면 "찾을 수 없음" 화면을 보고 싶다, so that 링크가 잘못됐다는 걸 안다
21. As a 투표자, I want to 제출이 실패하면 이유를 보고 다시 시도하고 싶다, so that 표가 사라졌는지 헷갈리지 않는다
22. As a 투표자, I want to 여러 사람이 동시에 투표해도 표가 빠짐없이 세어지길 원한다, so that 결과를 믿을 수 있다
23. As a 개발자, I want to 투표 기능을 API(`POST /api/polls`, `GET /api/polls/[id]`, `POST /api/polls/[id]/vote`)로도 쓰고 싶다, so that 나중에 다른 화면이나 앱에서 재사용할 수 있다

## Implementation Decisions

- **스키마** (수업 목표 스펙 + 선택지 순서용 `position` 한 열 추가):

  ```sql
  create table polls (
    id uuid primary key default gen_random_uuid(),
    question text not null,
    created_at timestamptz not null default now()
  );
  create table options (
    id uuid primary key default gen_random_uuid(),
    poll_id uuid not null references polls(id) on delete cascade,
    label text not null,
    position integer not null,
    vote_count integer not null default 0
  );
  ```

  `id`가 무작위 uuid라 순서를 보장하지 못하므로 `position`을 둔다.
- **깊은 모듈 하나: 투표 모듈(polls)** — `listPolls`, `createPoll`, `getPoll`, `castVote`, `getResults` 다섯 함수가 입력 검증과 SQL을 모두 감춘다. 페이지와 Route Handler는 이 모듈만 호출하는 얇은 껍데기다.
- **DB 인터페이스**: `query(text, params) → rows` 하나. 운영에서는 Neon HTTP 드라이버, 테스트에서는 PGlite 어댑터(ADR-0002).
- **투표 생성은 한 SQL 문장**: CTE로 poll insert → options insert(`unnest ... with ordinality`로 position 부여).
- **표는 한 SQL 문장**: `update options set vote_count = vote_count + 1 where id = $optionId and poll_id = $pollId`. 영향받은 행이 없으면 "선택지를 찾을 수 없음".
- **검증 규칙**: 질문은 앞뒤 공백 제거 후 1~200자. 선택지는 앞뒤 공백 제거 후 1~100자, 2~5개, 중복 불가. poll/option id는 uuid 형식이 아니면 DB에 묻지 않고 "없음"으로 처리.
- **API 계약**:
  - `POST /api/polls` body `{ question, options: string[] }` → 201 `{ id }` / 400 `{ error }`
  - `GET /api/polls/[id]` → 200 `{ id, question, createdAt, options: [{ id, label, voteCount }] }` / 404
  - `POST /api/polls/[id]/vote` body `{ optionId }` → 200 `{ ok: true }` / 400 / 404
- **페이지**: `/` 목록(서버 컴포넌트), `/new` 만들기 폼(클라이언트 → `POST /api/polls`), `/polls/[id]` 투표하기(클라이언트 폼 → vote API → 결과로 이동), `/polls/[id]/results` 결과(서버 컴포넌트). 모든 페이지는 요청 시점 렌더링.
- 비율은 `득표수 / 총 표 × 100`을 정수로 반올림, 총 표가 0이면 모두 0%.

## Testing Decisions

- 좋은 테스트는 외부 동작만 검증한다: 투표 모듈의 공개 함수를 호출하고 반환값/에러만 본다. SQL 문자열이나 내부 헬퍼는 검사하지 않는다.
- **테스트 seam은 하나: 투표 모듈.** 매 테스트마다 새 PGlite 인스턴스에 실제 스키마 SQL을 실행하고, 같은 SQL을 그대로 돌린다(모킹 없음).
- Route Handler와 페이지는 투표 모듈을 부르고 상태코드로 바꾸는 껍데기라 별도 자동 테스트 없이 수동 확인(`npm run dev`)으로 검증한다.
- 러너는 Node 내장 `node --test`(TypeScript 타입 제거 실행). 기존 테스트 선례는 없다.

## Out of Scope

- 로그인, 투표 생성자/관리자 권한, 투표 삭제·수정
- 중복 투표 방지(쿠키·IP·계정)
- 마감 시간, 결과 그래프, 실시간 갱신
- 복수 선택 투표
- 배포(Vercel)는 부록 핸드아웃에서 다룬다

## Further Notes

- 테이블 생성은 `npm run db:init`로 Neon에 한 번 실행한다(스키마 SQL은 테스트와 공유).
