import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">투표를 찾을 수 없어요</h1>
      <p className="mb-6 text-black/60 dark:text-white/60">주소가 잘못됐거나 없는 투표입니다.</p>
      <Link href="/" className="underline">
        전체 투표 목록으로
      </Link>
    </div>
  );
}
