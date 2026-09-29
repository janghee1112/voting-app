import { createHash, timingSafeEqual } from "node:crypto";

/**
 * 삭제 요청의 비밀번호가 서버에 설정된 운영자 비밀번호와 같은지 확인한다(ADR-0004).
 * 설정값이 비어 있으면 항상 false. 해시 후 상수 시간 비교로 길이·내용 차이를 드러내지 않는다.
 */
export function isOperatorPassword(input: unknown, expected: string | undefined): boolean {
  if (!expected || typeof input !== "string" || !input) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(input), digest(expected));
}
