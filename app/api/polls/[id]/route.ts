import { getDb } from "@/lib/db";
import { isOperatorPassword } from "@/lib/operator";
import { deletePoll, getPoll } from "@/lib/polls";

export async function GET(_request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  const { id } = await ctx.params;
  const poll = await getPoll(getDb(), id);
  if (!poll) return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  return Response.json(poll);
}

/** 운영자 비밀번호로 투표를 삭제한다(ADR-0004). body: { password } */
export async function DELETE(request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  const { id } = await ctx.params;
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return Response.json(
      { error: "서버에 운영자 비밀번호(ADMIN_PASSWORD)가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  if (!isOperatorPassword(body?.password, expected)) {
    return Response.json({ error: "운영자 비밀번호가 틀렸습니다." }, { status: 401 });
  }

  const deleted = await deletePoll(getDb(), id);
  if (!deleted) return Response.json({ error: "투표를 찾을 수 없습니다." }, { status: 404 });
  return Response.json({ ok: true });
}
