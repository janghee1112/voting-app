import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { formatKst } from "@/lib/format";
import { getPoll } from "@/lib/polls";
import DeletePoll from "./delete-poll";
import VoteForm from "./vote-form";

export default async function PollPage(props: PageProps<"/polls/[id]">) {
  const { id } = await props.params;
  const poll = await getPoll(getDb(), id);
  if (!poll) notFound();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">{poll.question}</h1>
      <p className="mb-6 text-sm text-black/60 dark:text-white/60">
        {poll.closesAt
          ? `${formatKst(poll.closesAt)} ${poll.isClosed ? "에 마감됨" : "마감"}`
          : "마감 없음"}
      </p>
      {poll.isClosed && (
        <p role="status" className="mb-4 rounded-md bg-black/5 px-4 py-3 dark:bg-white/10">
          마감된 투표입니다. 결과만 볼 수 있어요.
        </p>
      )}
      <VoteForm
        pollId={poll.id}
        isClosed={poll.isClosed}
        options={poll.options.map(({ id, label }) => ({ id, label }))}
      />
      <p className="mt-6 text-sm">
        <Link href={`/polls/${poll.id}/results`} className="underline">
          {poll.isClosed ? "결과 보기" : "투표하지 않고 결과 보기"}
        </Link>
      </p>
      <div className="mt-12 border-t border-black/10 pt-6 dark:border-white/15">
        <DeletePoll pollId={poll.id} />
      </div>
    </div>
  );
}
