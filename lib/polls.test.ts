import { test } from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./test-db.ts";
import type { Db } from "./db-types.ts";
import { castVote, createPoll, deletePoll, getPoll, getResults, listPolls, ValidationError, type NewPoll } from "./polls.ts";

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

test("투표를 조회하면 질문과 선택지가 입력 순서대로 0표로 나온다", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, { question: "요일?", options: ["월", "화", "수", "목", "금"] });
  const poll = await getPoll(db, id);
  assert.ok(poll);
  assert.equal(poll.question, "요일?");
  assert.deepEqual(poll.options.map((o) => o.label), ["월", "화", "수", "목", "금"]);
  assert.deepEqual(poll.options.map((o) => o.voteCount), [0, 0, 0, 0, 0]);
});

test("없는 투표나 uuid 가 아닌 id 는 null 이다", async () => {
  const db = await createTestDb();
  assert.equal(await getPoll(db, "00000000-0000-4000-8000-000000000000"), null);
  assert.equal(await getPoll(db, "not-a-uuid"), null);
});

test("표를 던지면 그 선택지의 득표수만 1 오른다", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, { question: "q", options: ["치킨", "피자"] });
  const [chicken] = (await getPoll(db, id))!.options;
  assert.equal(await castVote(db, id, chicken.id), "ok");
  const poll = await getPoll(db, id);
  assert.deepEqual(poll!.options.map((o) => [o.label, o.voteCount]), [["치킨", 1], ["피자", 0]]);
});

test("동시에 들어온 표도 빠짐없이 센다", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, { question: "q", options: ["a", "b"] });
  const [a] = (await getPoll(db, id))!.options;
  await Promise.all(Array.from({ length: 20 }, () => castVote(db, id, a.id)));
  assert.equal((await getPoll(db, id))!.options[0].voteCount, 20);
});

test("다른 투표의 선택지나 없는 선택지로는 표가 들어가지 않는다", async () => {
  const db = await createTestDb();
  const first = await createPoll(db, { question: "1", options: ["a", "b"] });
  const second = await createPoll(db, { question: "2", options: ["c", "d"] });
  const [otherOption] = (await getPoll(db, second))!.options;
  assert.equal(await castVote(db, first, otherOption.id), "not_found");
  assert.equal(await castVote(db, first, "00000000-0000-4000-8000-000000000000"), "not_found");
  assert.equal(await castVote(db, first, "nope"), "not_found");
  const all = [...(await getPoll(db, first))!.options, ...(await getPoll(db, second))!.options];
  assert.ok(all.every((o) => o.voteCount === 0));
});

test("결과는 선택지별 득표수와 반올림한 비율, 총 표 수를 입력 순서대로 준다", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, { question: "q", options: ["a", "b", "c"] });
  const [a, b] = (await getPoll(db, id))!.options;
  await castVote(db, id, a.id);
  await castVote(db, id, a.id);
  await castVote(db, id, b.id);
  const results = await getResults(db, id);
  assert.ok(results);
  assert.equal(results.totalVotes, 3);
  assert.deepEqual(
    results.options.map((o) => [o.label, o.voteCount, o.percent]),
    [["a", 2, 67], ["b", 1, 33], ["c", 0, 0]],
  );
});

test("표가 없으면 모두 0표 0%", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, { question: "q", options: ["a", "b"] });
  const results = await getResults(db, id);
  assert.equal(results!.totalVotes, 0);
  assert.deepEqual(results!.options.map((o) => o.percent), [0, 0]);
});

test("없는 투표의 결과는 null", async () => {
  const db = await createTestDb();
  assert.equal(await getResults(db, "00000000-0000-4000-8000-000000000000"), null);
});

async function closeNow(db: Db, pollId: string) {
  await db.query(`update polls set closes_at = now() - interval '1 minute' where id = $1`, [pollId]);
}

test("마감 시각 없이 만든 투표는 열려 있다", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, { question: "q", options: ["a", "b"] });
  const poll = await getPoll(db, id);
  assert.equal(poll!.closesAt, null);
  assert.equal(poll!.isClosed, false);
  assert.equal((await listPolls(db))[0].isClosed, false);
});

test("미래 마감 시각을 저장하고 아직 열려 있다", async () => {
  const db = await createTestDb();
  const closesAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const id = await createPoll(db, { question: "q", options: ["a", "b"], closesAt });
  const poll = await getPoll(db, id);
  assert.equal(poll!.closesAt, closesAt);
  assert.equal(poll!.isClosed, false);
});

for (const [name, closesAt] of [
  ["과거 마감 시각", new Date(Date.now() - 60 * 1000).toISOString()],
  ["날짜가 아닌 마감 시각", "내일쯤"],
]) {
  test(`${name}이면 투표를 만들지 않는다`, async () => {
    const db = await createTestDb();
    await assert.rejects(createPoll(db, { question: "q", options: ["a", "b"], closesAt }), ValidationError);
    assert.equal((await listPolls(db)).length, 0);
  });
}

test("마감이 지나면 마감된 투표가 되고 표를 거부한다", async () => {
  const db = await createTestDb();
  const id = await createPoll(db, {
    question: "q",
    options: ["a", "b"],
    closesAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
  const [a] = (await getPoll(db, id))!.options;
  assert.equal(await castVote(db, id, a.id), "ok");
  await closeNow(db, id);
  assert.equal((await getPoll(db, id))!.isClosed, true);
  assert.equal(await castVote(db, id, a.id), "closed");
  assert.equal((await getResults(db, id))!.options[0].voteCount, 1);
  assert.equal((await listPolls(db))[0].isClosed, true);
});

test("투표를 삭제하면 목록과 조회에서 사라지고 다른 투표는 남는다", async () => {
  const db = await createTestDb();
  const keep = await createPoll(db, { question: "남길 투표", options: ["a", "b"] });
  const remove = await createPoll(db, { question: "지울 투표", options: ["c", "d"] });
  assert.equal(await deletePoll(db, remove), true);
  assert.equal(await getPoll(db, remove), null);
  assert.deepEqual((await listPolls(db)).map((p) => p.id), [keep]);
  assert.ok(await getPoll(db, keep));
});

test("없는 투표나 잘못된 id 삭제는 false", async () => {
  const db = await createTestDb();
  assert.equal(await deletePoll(db, "00000000-0000-4000-8000-000000000000"), false);
  assert.equal(await deletePoll(db, "nope"), false);
});
