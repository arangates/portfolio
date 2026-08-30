import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

import {
  getDriveArchiveState,
  initializeDriveArchive,
  setDriveArchiveEnabled,
} from "@/lib/google-drive-archive";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("set_enabled"), enabled: z.boolean() }),
  z.object({ action: z.literal("initialize") }),
]);

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ archive: await getDriveArchiveState(session.user.id) });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = requestSchema.parse(await request.json());
    if (input.action === "set_enabled") {
      await setDriveArchiveEnabled(session.user.id, input.enabled);
    } else {
      await initializeDriveArchive(session.user.id);
    }
    return Response.json({ archive: await getDriveArchiveState(session.user.id) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update Google Drive archive" },
      { status: 400 },
    );
  }
}
