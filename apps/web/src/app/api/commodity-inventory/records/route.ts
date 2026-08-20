import {
  archiveCommodityInventoryItem,
  saveCommodityInventoryItem,
} from "@portfolio/api/commodity-inventory-mutations";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return Response.json(await saveCommodityInventoryItem(session.user.id, await request.json()), {
      status: 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save inventory item";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = z.uuid().parse(new URL(request.url).searchParams.get("id"));
    return Response.json(await archiveCommodityInventoryItem(session.user.id, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not archive inventory item";
    return Response.json({ error: message }, { status: 400 });
  }
}
