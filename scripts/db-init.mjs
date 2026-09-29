// Neon 에 테이블을 만든다: npm run db:init
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 이 없습니다. voting-app 폴더에서 실행했는지, .env.local 이 있는지 확인하세요.");
  process.exit(1);
}

const sql = neon(url);
const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = schema.split(";").map((s) => s.trim()).filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

const tables = await sql.query(
  "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
);
console.log("완료! 현재 테이블:", tables.map((t) => t.table_name).join(", "));
