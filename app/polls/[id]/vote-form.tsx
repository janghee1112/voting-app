"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { pollId: string; isClosed: boolean; options: { id: string; label: string }[] };

export default function VoteForm({ pollId, isClosed, options }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "투표하지 못했습니다. 다시 시도해 주세요.");
        setSubmitting(false);
        // 보는 사이 마감됐다면 화면을 새 상태(비활성화 + 안내)로 다시 그린다
        if (res.status === 409) router.refresh();
        return;
      }
      router.push(`/polls/${pollId}/results`);
    } catch {
      setError("네트워크 오류가 났습니다. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="sr-only">선택지</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex items-center has-[:disabled]:opacity-60 has-[:enabled]:cursor-pointer gap-3 rounded-lg border border-black/10 px-4 py-3 has-[:checked]:border-foreground dark:border-white/15"
          >
            <input
              type="radio"
              name="option"
              value={option.id}
              checked={selected === option.id}
              onChange={() => setSelected(option.id)}
              disabled={isClosed}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isClosed || !selected || submitting}
        className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {isClosed ? "마감됨" : submitting ? "제출 중…" : "투표하기"}
      </button>
    </form>
  );
}
