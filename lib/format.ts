/** 저장된 ISO 시각을 한국 시간으로 보여준다(ADR-0003). */
export function formatKst(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
