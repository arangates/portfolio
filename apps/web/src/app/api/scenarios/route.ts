import { runScenario, presetScenarios } from "@portfolio/api/scenario-engine";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

export async function GET(_request: Request) {
  return Response.json(presetScenarios);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const result = await runScenario(session.user.id, body.label, body.adjustments);
  return Response.json(result);
}
