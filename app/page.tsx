import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { formatKst } from "@/lib/format";
import { listPolls } from "@/lib/polls";

export default async function Home() {
  await connection();
  const polls = await listPolls(getDb());

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">전체 투표</h1>
      {polls.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          아직 투표가 없어요.{" "}
          <Link href="/new" className="underline">
            첫 투표를 만들어 보세요
          </Link>
          .
        </p>
      ) : (
        <ul className="space-y-2">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link
                href={`/polls/${poll.id}`}
                className="block rounded-lg border border-black/10 px-4 py-3 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">{poll.question}</span>
                  {poll.isClosed && (
                    <span className="rounded bg-black/10 px-1.5 py-0.5 text-xs dark:bg-white/15">
                      마감
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-sm text-black/50 dark:text-white/50">
                  {formatKst(poll.createdAt)} 생성
                  {poll.closesAt && !poll.isClosed && ` · ${formatKst(poll.closesAt)} 마감`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
