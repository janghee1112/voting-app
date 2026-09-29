import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getResults } from "@/lib/polls";

export default async function ResultsPage(props: PageProps<"/polls/[id]/results">) {
  const { id } = await props.params;
  const results = await getResults(getDb(), id);
  if (!results) notFound();

  return (
    <div>
      <p className="mb-1 text-sm text-black/50 dark:text-white/50">결과</p>
      <h1 className="mb-6 text-2xl font-bold">{results.question}</h1>

      <ol className="space-y-2">
        {results.options.map((option) => (
          <li
            key={option.id}
            className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 dark:border-white/15"
          >
            <span>{option.label}</span>
            <span className="tabular-nums">
              <strong>{option.voteCount}표</strong>
              <span className="ml-2 text-black/50 dark:text-white/50">{option.percent}%</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm text-black/60 dark:text-white/60">총 {results.totalVotes}표</p>

      <div className="mt-6 flex gap-4 text-sm">
        <Link href={`/polls/${results.id}`} className="underline">
          투표하러 가기
        </Link>
        <Link href="/" className="underline">
          전체 목록
        </Link>
      </div>
    </div>
  );
}
