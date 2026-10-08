import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@portfolio/auth";
import { headers } from "next/headers";
import { sendTestTemplatedEmail, sendWelcomeEmail } from "@/emails/services/email-service";
import { db } from "@portfolio/db";

const sendTestEmailSchema = z
  .object({
    type: z.enum(["test", "welcome"]).default("test"),
  })
  .strict();

async function currentUser() {
  return (await auth.api.getSession({ headers: await headers() }))?.user ?? null;
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = sendTestEmailSchema.parse(await request.json());
    const account = await db.query.user.findFirst({
      where: (table, { eq }) => eq(table.id, user.id),
      columns: { email: true, emailVerified: true, name: true },
    });

    if (!account?.email) {
      return NextResponse.json(
        { error: "Your account does not have an email address" },
        { status: 400 },
      );
    }

    if (!account.emailVerified) {
      return NextResponse.json(
        { error: "Verify your account email before sending a test email" },
        { status: 403 },
      );
    }

    const email = account.email;
    switch (input.type) {
      case "test":
        await sendTestTemplatedEmail(email, undefined, `api-test-${user.id}-${Date.now()}`);
        break;
      case "welcome":
        if (!account?.name) {
          return NextResponse.json({ error: "User name not found" }, { status: 400 });
        }
        await sendWelcomeEmail(email, account.name, `welcome-${user.id}-${Date.now()}`);
        break;
    }

    return NextResponse.json({
      success: true,
      sent: true,
      email,
      type: input.type,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    );
  }
}
