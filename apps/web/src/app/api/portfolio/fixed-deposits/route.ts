import { saveFixedDeposit } from "@zerodha-coin/api/portfolio-mutations";
import { auth } from "@zerodha-coin/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await saveFixedDeposit(session.user.id, await request.json());
    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create fixed deposit";
    return Response.json({ error: message }, { status: 400 });
  }
}
