import { deleteChatThread, getChatThread, renameChatThread } from "@/lib/ai-chat-threads";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };
const uuid = z.uuid();

async function authorized(request: Request, params: Params, mutation = false) {
  const { id } = await params.params;
  if (!uuid.safeParse(id).success) return null;
  if (mutation) {
    const origin = request.headers.get("origin");
    if (
      (origin && origin !== new URL(request.url).origin) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return null;
  }
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ? { userId: session.user.id, id } : null;
}

export async function GET(request: Request, params: Params) {
  const scope = await authorized(request, params);
  if (!scope) return Response.json({ error: "Not found" }, { status: 404 });
  const thread = await getChatThread(scope.userId, scope.id);
  if (!thread) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ thread }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, params: Params) {
  const scope = await authorized(request, params, true);
  if (!scope) return Response.json({ error: "Not found" }, { status: 404 });
  const data = z
    .object({ title: z.string().trim().min(1).max(100) })
    .safeParse(await request.json());
  if (!data.success) return Response.json({ error: "Invalid title" }, { status: 400 });
  const updated = await renameChatThread(scope.userId, scope.id, data.data.title);
  return Response.json({ updated: updated.length > 0 });
}

export async function DELETE(request: Request, params: Params) {
  const scope = await authorized(request, params, true);
  if (!scope) return Response.json({ error: "Not found" }, { status: 404 });
  const deleted = await deleteChatThread(scope.userId, scope.id);
  return Response.json({ deleted: deleted.length > 0 });
}
