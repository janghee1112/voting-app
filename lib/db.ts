import { neon } from "@neondatabase/serverless";
import type { Db } from "./db-types.ts";

let cached: Db | undefined;

/** 운영용 DB: .env.local 의 DATABASE_URL 로 Neon 에 HTTP 로 SQL 을 보낸다. */
export function getDb(): Db {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 환경변수가 없습니다. .env.local 을 확인하세요.");
  const sql = neon(url);
  cached = {
    query: (text, params = []) => sql.query(text, params) as never,
  };
  return cached;
}
