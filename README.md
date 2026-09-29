# 투표 앱 (voting-app)

만든 사람: 이장희 (강남대학교 AI전공)

동아리용 간단한 투표 앱. Next.js(App Router) + Route Handlers + TypeScript + Neon Postgres(ORM 없이 SQL).

## 처음 한 번

```bash
npm install
npm run db:init   # Neon 에 polls, options 테이블 생성 (.env.local 의 DATABASE_URL 사용)
```

`.env.local` 에 필요한 값:

```
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=운영자_비밀번호   # 투표 삭제용 (ADR-0004)
```

## 실행 / 테스트

```bash
npm run dev       # http://localhost:3000
npm test          # 투표 모듈 테스트 (인메모리 Postgres, Neon 불필요)
```

## 문서

- 용어집: `CONTEXT.md`
- 결정 기록: `docs/adr/`
- 스펙·티켓: `.scratch/voting-app/`
