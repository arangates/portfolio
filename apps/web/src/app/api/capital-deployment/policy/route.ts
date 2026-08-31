import { saveCapitalDeploymentPolicy } from "@portfolio/api/capital-deployment-mutations";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

function validationMessage(error: unknown) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? "Invalid policy";
  if (error instanceof SyntaxError) return "Invalid JSON request";
  return error instanceof Error ? error.message : "Could not save deployment policy";
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await saveCapitalDeploymentPolicy(session.user.id, await request.json()), {
      status: 201,
    });
  } catch (error) {
    return Response.json({ error: validationMessage(error) }, { status: 400 });
  }
}
