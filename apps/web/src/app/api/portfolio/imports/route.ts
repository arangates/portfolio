import { getRecentPortfolioImports, processPortfolioImport } from "@portfolio/api/portfolio-import";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

const kindSchema = z.enum(["zerodha_holdings", "degiro"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ imports: await getRecentPortfolioImports(session.user.id) });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const kind = kindSchema.parse(formData.get("kind"));
    const files = formData.getAll("files").filter((value): value is File => value instanceof File);
    if (files.length === 0) {
      return Response.json({ error: "Select at least one file" }, { status: 400 });
    }
    if (files.length > (kind === "zerodha_holdings" ? 1 : 2)) {
      return Response.json({ error: "Too many files selected" }, { status: 400 });
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          { error: `${file.name} is larger than the 10 MB limit` },
          { status: 413 },
        );
      }
      const lowerName = file.name.toLowerCase();
      const validExtension =
        kind === "zerodha_holdings" ? lowerName.endsWith(".xlsx") : lowerName.endsWith(".csv");
      const hasControlCharacters = [...file.name].some((character) => character.charCodeAt(0) < 32);
      if (!validExtension || hasControlCharacters) {
        return Response.json({ error: `Unsupported file: ${file.name}` }, { status: 415 });
      }
    }

    const results = await processPortfolioImport({
      userId: session.user.id,
      kind,
      files: await Promise.all(
        files.map(async (file) => ({
          name: file.name.replace(/^.*[\\/]/, "").slice(0, 255),
          type: file.type,
          bytes: new Uint8Array(await file.arrayBuffer()),
        })),
      ),
    });
    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
