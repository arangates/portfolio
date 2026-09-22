import { createChatThread, deleteChatThreads, listChatThreads } from "@/lib/ai-chat-threads";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const userId = await currentUser();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(
    { threads: await listChatThreads(userId) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const userId = await currentUser();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const thread = await createChatThread(userId);
  return Response.json(
    {
      thread: {
        id: thread.id,
        title: thread.title,
        provider: thread.provider,
        model: thread.model,
        updatedAt: thread.updatedAt,
      },
    },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const userId = await currentUser();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = z
    .object({ all: z.boolean().optional(), ids: z.array(z.uuid()).max(100).optional() })
    .safeParse(await request.json().catch(() => ({})));
  if (!body.success || (!body.data.all && !body.data.ids?.length))
    return Response.json({ error: "Choose conversations to delete" }, { status: 400 });
  const deleted = await deleteChatThreads(userId, body.data.all ? undefined : body.data.ids);
  return Response.json({ deleted: deleted.map((thread) => thread.id) });
}
