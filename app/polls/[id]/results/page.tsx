import Link from "next/link";
import { notFound } from "next/navigation";
import ResultBar from "@/components/ResultBar";
import { getDb } from "@/lib/db";
import { formatKst } from "@/lib/format";
import { getResults } from "@/lib/polls";

export default async function ResultsPage(props: PageProps<"/polls/[id]/results">) {
  const { id } = await props.params;
  const results = await getResults(getDb(), id);
  if (!results) notFound();

  const topCount = Math.max(...results.options.map((o) => o.voteCount));

  return (
    <div>
      <p className="mb-1 text-sm text-black/50 dark:text-white/50">
        결과{results.isClosed && results.closesAt && ` · ${formatKst(results.closesAt)}에 마감됨`}
      </p>
      <h1 className="mb-6 text-2xl font-bold">{results.question}</h1>

      {results.totalVotes === 0 && (
        <p className="mb-4 text-black/60 dark:text-white/60">아직 투표가 없어요.</p>
      )}

      <ol className="space-y-4">
        {results.options.map((option) => (
          <li key={option.id}>
            <ResultBar
              label={option.label}
              voteCount={option.voteCount}
              percent={option.percent}
              isLeader={results.totalVotes > 0 && option.voteCount === topCount}
            />
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm text-black/60 dark:text-white/60">총 {results.totalVotes}표</p>

      <div className="mt-6 flex gap-4 text-sm">
        {!results.isClosed && (
          <Link href={`/polls/${results.id}`} className="underline">
            투표하러 가기
          </Link>
        )}
        <Link href="/" className="underline">
          전체 목록
        </Link>
      </div>
    </div>
  );
}
