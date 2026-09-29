# ORM 없이 Neon 서버리스 드라이버로 직접 SQL을 쓴다

수업 목표가 "AI가 만든 SQL을 읽고 이해하는 것"이므로 Prisma·Drizzle 같은 ORM 대신 `@neondatabase/serverless`로 직접 SQL을 보낸다. 이 드라이버의 HTTP 모드는 요청마다 한 문장씩 실행되어 여러 문장에 걸친 트랜잭션을 쓰기 어렵기 때문에, 투표 생성처럼 여러 테이블에 쓰는 작업은 CTE를 써서 한 문장으로 끝내고, 표는 `vote_count = vote_count + 1` 한 문장으로 원자적으로 올린다. DB 접근은 `query(text, params)` 하나만 가진 작은 인터페이스 뒤에 두어, 테스트에서는 같은 SQL을 인메모리 Postgres(PGlite)에 그대로 실행한다.
