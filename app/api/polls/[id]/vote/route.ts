import { getDb } from "@/lib/db";
import { castVote } from "@/lib/polls";

export async function POST(request: Request, ctx: RouteContext<"/api/polls/[id]/vote">) {
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  const { optionId } = (body ?? {}) as { optionId?: unknown };
  if (typeof optionId !== "string" || !optionId) {
    return Response.json({ error: "선택지를 골라 주세요." }, { status: 400 });
  }

  const outcome = await castVote(getDb(), id, optionId);
  if (outcome === "closed") {
    return Response.json({ error: "마감된 투표입니다." }, { status: 409 });
  }
  if (outcome === "not_found") {
    return Response.json({ error: "투표 또는 선택지를 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
