"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_OPTIONS, MIN_OPTIONS, OPTION_LABEL_MAX, QUESTION_MAX } from "@/lib/poll-rules";

export default function CreatePollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [closesAtLocal, setClosesAtLocal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          options,
          // datetime-local 값은 브라우저 시간대로 해석해 ISO(UTC)로 보낸다
          closesAt: closesAtLocal ? new Date(closesAtLocal).toISOString() : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "투표를 만들지 못했습니다. 다시 시도해 주세요.");
        return;
      }
      router.push(`/polls/${data.id}`);
    } catch {
      setError("네트워크 오류가 났습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block">
        <span className="mb-1 block font-medium">질문</span>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={QUESTION_MAX}
          required
          placeholder="예: 이번 MT 장소는 어디로 할까요?"
          className="w-full rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="mb-1 font-medium">
          선택지 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
        </legend>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              maxLength={OPTION_LABEL_MAX}
              required
              placeholder={`선택지 ${index + 1}`}
              aria-label={`선택지 ${index + 1}`}
              className="flex-1 rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
            />
            {options.length > MIN_OPTIONS && (
              <button
                type="button"
                onClick={() => setOptions((prev) => prev.filter((_, i) => i !== index))}
                aria-label={`선택지 ${index + 1} 삭제`}
                className="rounded-md border border-black/20 px-3 dark:border-white/25"
              >
                삭제
              </button>
            )}
          </div>
        ))}
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={() => setOptions((prev) => [...prev, ""])}
            className="text-sm underline"
          >
            + 선택지 추가
          </button>
        )}
      </fieldset>

      <label className="block">
        <span className="mb-1 block font-medium">
          마감 시각 <span className="text-sm font-normal text-black/50 dark:text-white/50">(선택)</span>
        </span>
        <input
          type="datetime-local"
          value={closesAtLocal}
          onChange={(e) => setClosesAtLocal(e.target.value)}
          className="rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25 dark:[color-scheme:dark]"
        />
        <span className="mt-1 block text-sm text-black/50 dark:text-white/50">
          비워두면 마감 없이 계속 열려 있어요.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
      >
        {submitting ? "만드는 중…" : "투표 만들기"}
      </button>
    </form>
  );
}
