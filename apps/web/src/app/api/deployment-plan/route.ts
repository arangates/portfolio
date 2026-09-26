import { generateDeploymentPlan } from "@portfolio/api/deployment-plan";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

export async function GET(_request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const plan = await generateDeploymentPlan(session.user.id);
  return Response.json(plan);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const plan = await generateDeploymentPlan(session.user.id, body.amount);
  return Response.json(plan);
}
