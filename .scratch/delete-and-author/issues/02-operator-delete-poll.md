# 02: 운영자 비밀번호로 투표 삭제

**What to build:** 운영자가 투표하기 화면에서 비밀번호를 넣고 확인하면 투표가 선택지와 함께 삭제되고 목록으로 돌아간다. 비밀번호 없이는 API로도 지울 수 없다.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] deletePoll이 투표와 선택지를 지우고, 없는 id면 false
- [x] 비밀번호 미설정이면 항상 거부, 틀리면 401, 맞으면 200
- [x] 화면 안 2단계 확인, 성공 시 목록으로 이동, 실패 시 이유 표시

## Comments

- 구현 완료. `npm test` 29개 통과, 삭제 API 401/200/404/503 스모크 테스트 통과.
