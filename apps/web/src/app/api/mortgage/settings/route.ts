import { saveMortgageSettings } from "@portfolio/api/mortgage-mutations";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const runtime = "nodejs";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.number().finite().min(0).max(100_000_000);
const fraction = z.number().finite().min(0).max(0.5);

const request = z.object({
  loanNumber: z.string().trim().min(1).max(40),
  rateBasis: z.enum(["implied", "stated", "net"]),
  appreciation: z.number().finite().min(-0.2).max(0.3),
  energyLabel: z.string().max(5).nullable().optional(),
  nhg: z.boolean().optional(),
  terms: z.object({
    originalAmount: money,
    currentBalance: money,
    monthlyPayment: money,
    statedRate: fraction,
    discount: fraction,
    startDate: isoDate,
    firstPaymentDate: isoDate,
    endDate: isoDate,
    fixedRateEndDate: isoDate,
    asOf: isoDate,
    propertyValue: money,
    valuationDate: isoDate,
    freeRepaymentAllowance: money,
    registrationAmount: money,
  }),
  extras: z.array(z.object({ date: isoDate, amount: money.refine((value) => value > 0) })).max(200),
});

export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = request.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Check the mortgage values and try again." }, { status: 400 });
  }
  const { terms } = parsed.data;
  if (terms.currentBalance > terms.originalAmount || terms.endDate <= terms.firstPaymentDate) {
    return Response.json(
      {
        error:
          "The balance cannot exceed the original amount and the end date must follow the first payment.",
      },
      { status: 400 },
    );
  }
  try {
    return Response.json({ result: await saveMortgageSettings(session.user.id, parsed.data) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save the mortgage" },
      { status: 400 },
    );
  }
}
