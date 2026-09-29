import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import type { Db } from "./db-types.ts";

const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");

/** 테스트마다 새 인메모리 Postgres에 실제 스키마를 만들어 돌려준다. */
export async function createTestDb(): Promise<Db> {
  const pg = new PGlite();
  await pg.exec(schema);
  return {
    async query(text, params = []) {
      const result = await pg.query(text, params);
      return result.rows as never;
    },
  };
}
