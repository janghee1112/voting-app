type Props = {
  label: string;
  voteCount: number;
  percent: number;
  /** 가장 많이 받은 선택지(동률이면 모두). 표가 0개면 아무도 아님. */
  isLeader: boolean;
};

/** 선택지 하나의 퍼센트 막대. 색 구분 대신 1등만 진하게 칠한다. */
export default function ResultBar({ label, voteCount, percent, isLeader }: Props) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <span className={isLeader ? "font-semibold" : undefined}>
          {label}
          {isLeader && <span className="ml-2 text-xs text-black/50 dark:text-white/50">1위</span>}
        </span>
        <span className="shrink-0 tabular-nums">
          <strong>{voteCount}표</strong>
          <span className="ml-2 inline-block w-10 text-right text-black/60 dark:text-white/60">
            {percent}%
          </span>
        </span>
      </div>
      <div
        role="meter"
        aria-label={`${label} 득표율`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
      >
        <div
          className={`h-full rounded-full ${isLeader ? "bg-foreground" : "bg-black/35 dark:bg-white/40"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
