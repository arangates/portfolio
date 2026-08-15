import {
  archiveFireRecord,
  saveFamilyMember,
  saveFireExpense,
  saveFireIncomeStream,
  saveFireOneTimeCost,
  saveFireProfile,
  saveFireScenario,
  type FireArchiveKind,
} from "@portfolio/api/fire-mutations";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

const saveRequest = z.object({
  kind: z.enum([
    "fire_profile",
    "family_member",
    "fire_expense",
    "fire_one_time_cost",
    "fire_income_stream",
    "fire_scenario",
  ]),
  data: z.unknown(),
});

const archiveKind = z.enum([
  "family_member",
  "fire_expense",
  "fire_one_time_cost",
  "fire_income_stream",
  "fire_scenario",
]);

function validationMessage(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof SyntaxError) return "Invalid JSON request";
  return fallback;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const input = saveRequest.parse(await request.json());
    const result =
      input.kind === "fire_profile"
        ? await saveFireProfile(session.user.id, input.data)
        : input.kind === "family_member"
          ? await saveFamilyMember(session.user.id, input.data)
          : input.kind === "fire_expense"
            ? await saveFireExpense(session.user.id, input.data)
            : input.kind === "fire_one_time_cost"
              ? await saveFireOneTimeCost(session.user.id, input.data)
              : input.kind === "fire_income_stream"
                ? await saveFireIncomeStream(session.user.id, input.data)
                : await saveFireScenario(session.user.id, input.data);
    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: validationMessage(error, "Could not save FIRE record") },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const kind = archiveKind.parse(url.searchParams.get("kind")) as FireArchiveKind;
    const id = z.uuid().parse(url.searchParams.get("id"));
    return Response.json(await archiveFireRecord(session.user.id, kind, id));
  } catch (error) {
    return Response.json(
      { error: validationMessage(error, "Could not archive FIRE record") },
      { status: 400 },
    );
  }
}
