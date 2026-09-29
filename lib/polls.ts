import type { Db } from "./db-types.ts";
import { MAX_OPTIONS, MIN_OPTIONS, OPTION_LABEL_MAX, QUESTION_MAX } from "./poll-rules.ts";

/** 사용자가 고칠 수 있는 입력 오류. 메시지는 그대로 화면에 보여준다. */
export class ValidationError extends Error {
  name = "ValidationError";
}

export type PollSummary = {
  id: string;
  question: string;
  createdAt: string;
  /** 마감 시각(ISO). 없으면 무기한. */
  closesAt: string | null;
  /** DB 시각 기준으로 마감 시각이 지났는지. */
  isClosed: boolean;
};

export type NewPoll = { question: string; options: string[]; closesAt?: string | null };

type PollRow = {
  id: string;
  question: string;
  created_at: Date | string;
  closes_at: Date | string | null;
  is_closed: boolean;
};

/** polls 행을 고를 때 쓰는 열 목록. is_closed 는 DB 의 now() 로 판정한다(ADR-0003). */
const POLL_COLUMNS = `p.id, p.question, p.created_at, p.closes_at,
  (p.closes_at is not null and p.closes_at <= now()) as is_closed`;

function toPollSummary(row: PollRow): PollSummary {
  return {
    id: row.id,
    question: row.question,
    createdAt: new Date(row.created_at).toISOString(),
    closesAt: row.closes_at === null ? null : new Date(row.closes_at).toISOString(),
    isClosed: Boolean(row.is_closed),
  };
}

function validateClosesAt(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  const date = typeof value === "string" ? new Date(value) : new Date(NaN);
  if (Number.isNaN(date.getTime())) throw new ValidationError("마감 시각 형식이 올바르지 않습니다.");
  if (date.getTime() <= Date.now()) throw new ValidationError("마감 시각은 지금보다 뒤여야 합니다.");
  return date.toISOString();
}

function validateNewPoll(input: NewPoll) {
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
  return { question, options, closesAt: validateClosesAt(input.closesAt) };
}

/** 투표와 선택지를 한 SQL 문장으로 만들고 새 투표 id를 돌려준다. */
export async function createPoll(db: Db, input: NewPoll): Promise<string> {
  const { question, options, closesAt } = validateNewPoll(input);
  const rows = await db.query<{ id: string }>(
    `with new_poll as (
       insert into polls (question, closes_at) values ($1, $3) returning id
     ), new_options as (
       insert into options (poll_id, label, position)
       select new_poll.id, o.label, o.position
       from new_poll, unnest($2::text[]) with ordinality as o(label, position)
     )
     select id from new_poll`,
    [question, options, closesAt],
  );
  return rows[0].id;
}

/** 전체 투표를 최신순으로 돌려준다. */
export async function listPolls(db: Db): Promise<PollSummary[]> {
  const rows = await db.query<PollRow>(
    `select ${POLL_COLUMNS} from polls p order by p.created_at desc, p.id`,
  );
  return rows.map(toPollSummary);
}

export type PollOption = { id: string; label: string; voteCount: number };

export type Poll = PollSummary & { options: PollOption[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 투표 하나와 선택지(입력 순서)를 돌려준다. 없거나 id 형식이 틀리면 null. */
export async function getPoll(db: Db, pollId: string): Promise<Poll | null> {
  if (!UUID.test(pollId)) return null;
  const rows = await db.query<PollRow & { option_id: string; label: string; vote_count: number }>(
    `select ${POLL_COLUMNS}, o.id as option_id, o.label, o.vote_count
     from polls p
     join options o on o.poll_id = p.id
     where p.id = $1
     order by o.position`,
    [pollId],
  );
  if (rows.length === 0) return null;
  return {
    ...toPollSummary(rows[0]),
    options: rows.map((r) => ({ id: r.option_id, label: r.label, voteCount: Number(r.vote_count) })),
  };
}

export type VoteOutcome = "ok" | "not_found" | "closed";

/**
 * 선택지의 득표수를 원자적으로 1 올린다.
 * 마감 여부는 같은 SQL 문장에서 DB 시각으로 확인한다(ADR-0003).
 */
export async function castVote(db: Db, pollId: string, optionId: string): Promise<VoteOutcome> {
  if (!UUID.test(pollId) || !UUID.test(optionId)) return "not_found";
  const [row] = await db.query<{ counted: boolean; closed: boolean | null }>(
    `with target as (
       select o.id, (p.closes_at is not null and p.closes_at <= now()) as closed
       from options o
       join polls p on p.id = o.poll_id
       where o.id = $1 and o.poll_id = $2
     ), counted as (
       update options set vote_count = vote_count + 1
       where id = (select id from target where not closed)
       returning id
     )
     select exists (select 1 from counted) as counted,
            (select closed from target) as closed`,
    [optionId, pollId],
  );
  if (row.counted) return "ok";
  return row.closed ? "closed" : "not_found";
}

export type OptionResult = PollOption & { percent: number };

export type PollResults = PollSummary & { totalVotes: number; options: OptionResult[] };

/** 선택지별 득표수와 비율(정수 반올림, 표가 없으면 0%)을 돌려준다. */
export async function getResults(db: Db, pollId: string): Promise<PollResults | null> {
  const poll = await getPoll(db, pollId);
  if (!poll) return null;
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0);
  return {
    ...poll,
    totalVotes,
    options: poll.options.map((o) => ({
      ...o,
      percent: totalVotes === 0 ? 0 : Math.round((o.voteCount / totalVotes) * 100),
    })),
  };
}
