import { BANK_CATEGORIES } from "@portfolio/api/bank-statement-parser";
import { updateBankTransactionCategory } from "@portfolio/api/cash-flow-queries";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await context.params;
    const { category } = z
      .object({ category: z.enum(BANK_CATEGORIES) })
      .parse(await request.json());
    return Response.json({
      result: await updateBankTransactionCategory(session.user.id, id, category),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not update transaction" },
      { status: 400 },
    );
  }
}
