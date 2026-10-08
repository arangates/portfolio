import { NextResponse } from "next/server";
import { renderEmailToHTML } from "@/emails/utils/render-email";
import { NotificationEmailPreview } from "@/emails/templates/NotificationEmail";
import { TestEmailPreview } from "@/emails/templates/TestEmail";
import { WelcomeEmailPreview } from "@/emails/templates/WelcomeEmail";
import { BillsEmailPreview } from "@/emails/templates/BillsEmail";
import { ContractsEmailPreview } from "@/emails/templates/ContractsEmail";
import { DepositsEmailPreview } from "@/emails/templates/DepositsEmail";
import { InvestmentsEmailPreview } from "@/emails/templates/InvestmentsEmail";

export async function GET(request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  try {
    const resolvedParams = await params;
    let template = resolvedParams.slug?.[0] || "notification";

    // Map of available templates
    const templates: Record<string, React.ReactElement> = {
      notification: <NotificationEmailPreview />,
      test: <TestEmailPreview />,
      welcome: <WelcomeEmailPreview />,
      bills: <BillsEmailPreview />,
      contracts: <ContractsEmailPreview />,
      deposits: <DepositsEmailPreview />,
      investments: <InvestmentsEmailPreview />,
    };

    // Default to notification if template not found
    if (!templates[template]) {
      template = "notification";
    }

    // Render the email to HTML
    const html = await renderEmailToHTML(templates[template]);

    // Return the HTML for preview
    return NextResponse.json({
      success: true,
      template,
      html,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error rendering email preview:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to render email preview",
      },
      { status: 500 },
    );
  }
}
