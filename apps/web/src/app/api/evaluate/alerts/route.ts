import {
  getActiveAlerts,
  acknowledgeAlert,
  acknowledgeAllAlerts,
} from "@portfolio/api/evaluation-queries";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";

export async function GET(_request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alerts = await getActiveAlerts(session.user.id);
    return Response.json(alerts);
  } catch (error) {
    console.error("Failed to fetch active alerts:", error);
    return Response.json({ error: "Failed to fetch active alerts" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.all) {
      await acknowledgeAllAlerts(session.user.id);
    } else if (body.alertId) {
      await acknowledgeAlert(session.user.id, body.alertId);
    } else {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to acknowledge alerts:", error);
    return Response.json({ error: "Failed to acknowledge alerts" }, { status: 500 });
  }
}
