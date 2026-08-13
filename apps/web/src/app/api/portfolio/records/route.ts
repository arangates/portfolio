import {
  archivePortfolioRecord,
  saveBankAccount,
  saveCommodity,
  saveExchangeRate,
  saveFixedDeposit,
  saveManualAsset,
  savePortfolioPreference,
  type ArchiveKind,
} from "@portfolio/api/portfolio-mutations";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

const saveRequest = z.object({
  kind: z.enum([
    "bank_account",
    "fixed_deposit",
    "commodity",
    "manual_asset",
    "preference",
    "exchange_rate",
  ]),
  data: z.unknown(),
});

const archiveKind = z.enum(["bank_account", "fixed_deposit", "commodity", "manual_asset"]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = saveRequest.parse(await request.json());
    const result =
      input.kind === "bank_account"
        ? await saveBankAccount(session.user.id, input.data)
        : input.kind === "fixed_deposit"
          ? await saveFixedDeposit(session.user.id, input.data)
          : input.kind === "commodity"
            ? await saveCommodity(session.user.id, input.data)
            : input.kind === "manual_asset"
              ? await saveManualAsset(session.user.id, input.data)
              : input.kind === "preference"
                ? await savePortfolioPreference(session.user.id, input.data)
                : await saveExchangeRate(session.user.id, input.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save record";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const kind = archiveKind.parse(url.searchParams.get("kind")) as ArchiveKind;
    const id = z.uuid().parse(url.searchParams.get("id"));
    return Response.json(await archivePortfolioRecord(session.user.id, kind, id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not archive record";
    return Response.json({ error: message }, { status: 400 });
  }
}
