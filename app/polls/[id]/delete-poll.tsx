"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 운영자 전용 삭제. 브라우저 confirm 창 대신 화면 안에서 2단계로 확인한다. */
export default function DeletePoll({ pollId }: { pollId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/polls/${pollId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "삭제하지 못했습니다. 다시 시도해 주세요.");
        setDeleting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 났습니다. 다시 시도해 주세요.");
      setDeleting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 underline"
      >
        투표 삭제 (운영자)
      </button>
    );
  }

  return (
    <form
      onSubmit={handleDelete}
      className="space-y-3 rounded-lg border border-red-600/40 p-4"
    >
      <p className="text-sm">
        이 투표와 모든 표가 <strong>영구 삭제</strong>됩니다. 운영자 비밀번호를 입력하세요.
      </p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        aria-label="운영자 비밀번호"
        placeholder="운영자 비밀번호"
        className="w-full rounded-md border border-black/20 bg-transparent px-3 py-2 dark:border-white/25"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={deleting || !password}
          className="rounded-md bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {deleting ? "삭제 중…" : "정말 삭제"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setPassword("");
            setError(null);
          }}
          className="rounded-md border border-black/20 px-4 py-2 text-sm dark:border-white/25"
        >
          취소
        </button>
      </div>
    </form>
  );
}
