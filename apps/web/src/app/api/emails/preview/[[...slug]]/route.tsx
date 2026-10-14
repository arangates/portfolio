import { type NextRequest, NextResponse } from "next/server";
import {
  ActivationEmailPreview,
  BillsEmailPreview,
  BullionValuationEmailPreview,
  CashFlowDigestEmailPreview,
  ContractsEmailPreview,
  CurrencyAlertEmailPreview,
  DepositsEmailPreview,
  DividendPayoutEmailPreview,
  DocumentExpiryEmailPreview,
  FireMilestoneEmailPreview,
  InvestmentsEmailPreview,
  MortgageUpdateEmailPreview,
  NotificationEmailPreview,
  SalaryCreditEmailPreview,
  SipExecutionEmailPreview,
  TaxFilingReminderEmailPreview,
  TestEmailPreview,
  WelcomeEmailPreview,
  renderEmailToHTML,
  renderEmailToText,
} from "@portfolio/emails";
import type React from "react";

const previewTemplates: Record<string, { name: string; component: React.ReactElement }> = {
  activation: {
    name: "Activation Email",
    component: <ActivationEmailPreview />,
  },
  welcome: {
    name: "Welcome Email",
    component: <WelcomeEmailPreview />,
  },
  notification: {
    name: "Notification Email",
    component: <NotificationEmailPreview />,
  },
  bills: {
    name: "Bills Email",
    component: <BillsEmailPreview />,
  },
  contracts: {
    name: "Contracts Email",
    component: <ContractsEmailPreview />,
  },
  deposits: {
    name: "Deposits Email",
    component: <DepositsEmailPreview />,
  },
  investments: {
    name: "Investments Email",
    component: <InvestmentsEmailPreview />,
  },
  "currency-alert": {
    name: "Currency Alert",
    component: <CurrencyAlertEmailPreview />,
  },
  "fire-milestone": {
    name: "FIRE Milestone",
    component: <FireMilestoneEmailPreview />,
  },
  "salary-credit": {
    name: "Salary Credit",
    component: <SalaryCreditEmailPreview />,
  },
  "bullion-valuation": {
    name: "Bullion Valuation",
    component: <BullionValuationEmailPreview />,
  },
  "mortgage-update": {
    name: "Mortgage Amortisation",
    component: <MortgageUpdateEmailPreview />,
  },
  "tax-filing": {
    name: "Advance Tax Reminder",
    component: <TaxFilingReminderEmailPreview />,
  },
  "cashflow-digest": {
    name: "Monthly Cash Flow",
    component: <CashFlowDigestEmailPreview />,
  },
  "dividend-payout": {
    name: "Dividend Payout",
    component: <DividendPayoutEmailPreview />,
  },
  "sip-execution": {
    name: "SIP Execution",
    component: <SipExecutionEmailPreview />,
  },
  "document-expiry": {
    name: "Document Expiry Notice",
    component: <DocumentExpiryEmailPreview />,
  },
  test: {
    name: "Test Email",
    component: <TestEmailPreview />,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const url = new URL(request.url);
    const templateKey =
      resolvedParams.slug?.[0] || url.searchParams.get("template") || "activation";

    const format = url.searchParams.get("format");
    const templateConfig = previewTemplates[templateKey] || previewTemplates.activation;

    const html = await renderEmailToHTML(templateConfig.component);

    // If requested as raw HTML (e.g. for iframe embedding or direct browser inspection)
    if (format === "html") {
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // If requested as raw text
    if (format === "text") {
      const text = await renderEmailToText(templateConfig.component);
      return new Response(text, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // Default JSON response
    return NextResponse.json({
      success: true,
      template: templateKey,
      name: templateConfig.name,
      html,
      availableTemplates: Object.keys(previewTemplates),
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
