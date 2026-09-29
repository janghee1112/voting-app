import type { Db } from "./db-types.ts";
import { MAX_OPTIONS, MIN_OPTIONS, OPTION_LABEL_MAX, QUESTION_MAX } from "./poll-rules.ts";

/** 사용자가 고칠 수 있는 입력 오류. 메시지는 그대로 화면에 보여준다. */
export class ValidationError extends Error {
  name = "ValidationError";
}

export type PollSummary = { id: string; question: string; createdAt: string };

export type NewPoll = { question: string; options: string[] };

function validateNewPoll(input: NewPoll): NewPoll {
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (!question) throw new ValidationError("질문을 입력해 주세요.");
  if (question.length > QUESTION_MAX) {
    throw new ValidationError(`질문은 ${QUESTION_MAX}자 이하로 입력해 주세요.`);
  }

  if (!Array.isArray(input.options)) throw new ValidationError("선택지를 입력해 주세요.");
  const options = input.options.map((o) => (typeof o === "string" ? o.trim() : ""));
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    throw new ValidationError(`선택지는 ${MIN_OPTIONS}~${MAX_OPTIONS}개여야 합니다.`);
  }
  if (options.some((o) => !o)) throw new ValidationError("빈 선택지가 있습니다.");
  if (options.some((o) => o.length > OPTION_LABEL_MAX)) {
    throw new ValidationError(`선택지는 ${OPTION_LABEL_MAX}자 이하로 입력해 주세요.`);
  }
  if (new Set(options).size !== options.length) {
    throw new ValidationError("같은 선택지가 두 번 들어 있습니다.");
  }
  return { question, options };
}

/** 투표와 선택지를 한 SQL 문장으로 만들고 새 투표 id를 돌려준다. */
export async function createPoll(db: Db, input: NewPoll): Promise<string> {
  const { question, options } = validateNewPoll(input);
  const rows = await db.query<{ id: string }>(
    `with new_poll as (
       insert into polls (question) values ($1) returning id
     ), new_options as (
       insert into options (poll_id, label, position)
       select new_poll.id, o.label, o.position
       from new_poll, unnest($2::text[]) with ordinality as o(label, position)
     )
     select id from new_poll`,
    [question, options],
  );
  return rows[0].id;
}

/** 전체 투표를 최신순으로 돌려준다. */
export async function listPolls(db: Db): Promise<PollSummary[]> {
  const rows = await db.query<{ id: string; question: string; created_at: Date | string }>(
    `select id, question, created_at from polls order by created_at desc, id`,
  );
  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

export type PollOption = { id: string; label: string; voteCount: number };

export type Poll = PollSummary & { options: PollOption[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 투표 하나와 선택지(입력 순서)를 돌려준다. 없거나 id 형식이 틀리면 null. */
export async function getPoll(db: Db, pollId: string): Promise<Poll | null> {
  if (!UUID.test(pollId)) return null;
  const rows = await db.query<{
    id: string;
    question: string;
    created_at: Date | string;
    option_id: string;
    label: string;
    vote_count: number;
  }>(
    `select p.id, p.question, p.created_at, o.id as option_id, o.label, o.vote_count
     from polls p
     join options o on o.poll_id = p.id
     where p.id = $1
     order by o.position`,
    [pollId],
  );
  if (rows.length === 0) return null;
  const [first] = rows;
  return {
    id: first.id,
    question: first.question,
    createdAt: new Date(first.created_at).toISOString(),
    options: rows.map((r) => ({ id: r.option_id, label: r.label, voteCount: Number(r.vote_count) })),
  };
}

/** 선택지의 득표수를 원자적으로 1 올린다. 그 투표의 선택지가 아니면 false. */
export async function castVote(db: Db, pollId: string, optionId: string): Promise<boolean> {
  if (!UUID.test(pollId) || !UUID.test(optionId)) return false;
  const rows = await db.query<{ id: string }>(
    `update options set vote_count = vote_count + 1
     where id = $1 and poll_id = $2
     returning id`,
    [optionId, pollId],
  );
  return rows.length === 1;
}
