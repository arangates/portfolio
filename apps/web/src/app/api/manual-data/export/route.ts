import { createManualDataExport } from "@portfolio/api/manual-data-portability";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

const formatSchema = z.enum(["xlsx", "csv"]);

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const format = formatSchema.parse(new URL(request.url).searchParams.get("format") ?? "xlsx");
    const result = await createManualDataExport(session.user.id, format);
    const date = new Date().toISOString().slice(0, 10);
    return new Response(result.bytes, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="selvam-manual-data-${date}.${format}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create export";
    return Response.json({ error: message }, { status: 400 });
  }
}
