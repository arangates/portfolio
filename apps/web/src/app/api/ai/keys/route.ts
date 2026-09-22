import { providerStatus, removeProviderKey, saveProviderKey } from "@/lib/ai-credentials";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

const provider = z.enum(["openai", "google", "anthropic", "opencode", "mistral"]);
const input = z.object({ provider, key: z.string().trim().min(8).max(512) });

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (
    (!origin || origin === new URL(request.url).origin) &&
    request.headers.get("sec-fetch-site") !== "cross-site"
  );
}

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const id = await userId();
  if (!id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await providerStatus(id), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const id = await userId();
  if (!id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { provider, key } = input.parse(await request.json());
    await saveProviderKey(id, provider, key);
    return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Choose a provider and enter a valid API key." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "Invalid origin" }, { status: 403 });
  const id = await userId();
  if (!id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = provider.safeParse(new URL(request.url).searchParams.get("provider"));
  if (!parsed.success) return Response.json({ error: "Invalid provider" }, { status: 400 });
  await removeProviderKey(id, parsed.data);
  return Response.json({ removed: true });
}
