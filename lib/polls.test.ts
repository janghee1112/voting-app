import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./test-db.ts";
import { createPoll, listPolls, ValidationError, type NewPoll } from "./polls.ts";

test("투표를 만들면 목록에 질문이 보인다", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, { question: "MT 장소는?", options: ["가평", "양평"] });
  const polls = await listPolls(db);
  assert.equal(polls.length, 1);
  assert.equal(polls[0].id, id);
  assert.equal(polls[0].question, "MT 장소는?");
});

test("목록은 최신 투표가 먼저 온다", async () => {
  const db = await createTestDb();
  await createPoll(db, { question: "첫 번째", options: ["a", "b"] });
  await createPoll(db, { question: "두 번째", options: ["a", "b"] });
  const polls = await listPolls(db);
  assert.deepEqual(polls.map((p) => p.question), ["두 번째", "첫 번째"]);
});

test("질문과 선택지의 앞뒤 공백을 정리해 저장한다", async () => {
  const db = await createTestDb();
  await createPoll(db, { question: "  점심 메뉴?  ", options: [" 치킨 ", "피자"] });
  const [poll] = await listPolls(db);
  assert.equal(poll.question, "점심 메뉴?");
});

const invalidPolls: [string, NewPoll][] = [
  ["빈 질문", { question: "   ", options: ["a", "b"] }],
  ["선택지 1개", { question: "q", options: ["a"] }],
  ["선택지 6개", { question: "q", options: ["1", "2", "3", "4", "5", "6"] }],
  ["빈 선택지", { question: "q", options: ["a", "  "] }],
  ["중복 선택지(공백만 다름)", { question: "q", options: ["치킨", " 치킨 "] }],
  ["201자 질문", { question: "가".repeat(201), options: ["a", "b"] }],
];

for (const [name, input] of invalidPolls) {
  test(`${name}이면 투표를 만들지 않는다`, async () => {
    const db = await createTestDb();
    await assert.rejects(
      createPoll(db, input),
      ValidationError,
    );
    assert.equal((await listPolls(db)).length, 0);
  });
}

test("선택지 5개까지는 만들 수 있다", async () => {
  const db = await createTestDb();
  await createPoll(db, { question: "q", options: ["1", "2", "3", "4", "5"] });
  assert.equal((await listPolls(db)).length, 1);
});
