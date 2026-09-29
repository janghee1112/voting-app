import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getPoll } from "@/lib/polls";
import VoteForm from "./vote-form";

export default async function PollPage(props: PageProps<"/polls/[id]">) {
  const { id } = await props.params;
  const poll = await getPoll(getDb(), id);
  if (!poll) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{poll.question}</h1>
      <VoteForm pollId={poll.id} options={poll.options.map(({ id, label }) => ({ id, label }))} />
      <p className="mt-6 text-sm">
        <Link href={`/polls/${poll.id}/results`} className="underline">
          투표하지 않고 결과 보기
        </Link>
      </p>
    </div>
  );
}
