import { getDb } from "@/lib/db";
import { createPoll, ValidationError } from "@/lib/polls";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { question, options, closesAt } = (body ?? {}) as {
    question?: unknown;
    options?: unknown;
    closesAt?: unknown;
  };
  try {
    const id = await createPoll(getDb(), {
      question: question as string,
      options: options as string[],
      closesAt: closesAt as string | null | undefined,
    });
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
