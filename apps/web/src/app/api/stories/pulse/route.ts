import { auth } from "@portfolio/auth";
import { getFinancialStoryFeed } from "@portfolio/api/stories";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const feed = await getFinancialStoryFeed(session.user.id, session.user.name || "Aranga");
    return Response.json(feed);
  } catch (error) {
    console.error("[stories/pulse] Failed to load story feed:", error);
    return Response.json({ error: "Could not generate story feed" }, { status: 500 });
  }
}
