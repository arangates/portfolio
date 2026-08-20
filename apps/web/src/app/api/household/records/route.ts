import {
  archiveHouseholdRecord,
  saveHouseholdBudgetItem,
  saveHouseholdContract,
  saveHouseholdProfile,
  saveHouseholdPurchase,
  saveHouseholdScenario,
  saveHouseholdScenarioLine,
  type HouseholdArchiveKind,
} from "@portfolio/api/household-mutations";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

const saveRequest = z.object({
  kind: z.enum([
    "household_profile",
    "household_budget_item",
    "household_scenario",
    "household_scenario_line",
    "household_service_contract",
    "household_purchase",
  ]),
  data: z.unknown(),
});
const archiveKind = z.enum([
  "household_budget_item",
  "household_scenario",
  "household_scenario_line",
  "household_service_contract",
  "household_purchase",
]);

function safeMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  if (error instanceof SyntaxError) return "Invalid JSON request";
  return fallback;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = saveRequest.parse(await request.json());
    const result =
      input.kind === "household_profile"
        ? await saveHouseholdProfile(session.user.id, input.data)
        : input.kind === "household_budget_item"
          ? await saveHouseholdBudgetItem(session.user.id, input.data)
          : input.kind === "household_scenario"
            ? await saveHouseholdScenario(session.user.id, input.data)
            : input.kind === "household_scenario_line"
              ? await saveHouseholdScenarioLine(session.user.id, input.data)
              : input.kind === "household_service_contract"
                ? await saveHouseholdContract(session.user.id, input.data)
                : await saveHouseholdPurchase(session.user.id, input.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: safeMessage(error, "Could not save household record") },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const url = new URL(request.url);
    const kind = archiveKind.parse(url.searchParams.get("kind")) as HouseholdArchiveKind;
    const id = z.uuid().parse(url.searchParams.get("id"));
    return Response.json(await archiveHouseholdRecord(session.user.id, kind, id));
  } catch (error) {
    return Response.json(
      { error: safeMessage(error, "Could not archive household record") },
      { status: 400 },
    );
  }
}
