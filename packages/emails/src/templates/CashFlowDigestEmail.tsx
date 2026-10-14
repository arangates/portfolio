import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface CashFlowDigestEmailProps {
  userName?: string;
  monthName?: string;
  totalInflow?: string;
  totalOutflow?: string;
  netSaved?: string;
  savingsRate?: string;
  topSpendingCategory?: string;
  topCategoryAmount?: string;
  anomaliesDetected?: number;
}

export function CashFlowDigestEmail({
  userName = "Priya",
  monthName = "Last Month",
  totalInflow = "₹2,64,000",
  totalOutflow = "₹1,21,200",
  netSaved = "₹1,42,800",
  savingsRate = "54%",
  topSpendingCategory = "Housing & Utilities",
  topCategoryAmount = "₹58,400",
  anomaliesDetected = 1,
}: CashFlowDigestEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Monthly Cash Flow Digest: ${savingsRate} savings rate · ${netSaved} retained`}
      title={`Monthly Cash Flow & Burn Digest — ${companyName}`}
      companyName={companyName}
      showWordmark={true}
    >
      {/* Bold Main Headline (Wise Style) */}
      <Heading
        as="h1"
        style={{
          fontSize: "27px",
          fontWeight: 800,
          lineHeight: "1.25",
          letterSpacing: "-0.5px",
          color: "#0E1318",
          margin: "12px 0 8px 0",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Your monthly cash flow digest.
      </Heading>

      <Text
        style={{
          fontSize: "14.5px",
          lineHeight: "1.5",
          color: "#596066",
          margin: "0 auto 10px auto",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Income, spending & savings analysis for {monthName}:
      </Text>

      {/* Prominent Stat Callout */}
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#166534",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {savingsRate} Savings Rate · {netSaved} saved
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="Monthly Cash Flow Digest" />

      {/* Body Copy */}
      <Text
        style={{
          fontSize: "14.5px",
          lineHeight: "1.6",
          color: "#374151",
          margin: "0 auto 16px auto",
          maxWidth: "480px",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Hi {userName}, you generated <strong style={{ color: "#0E1318" }}>{totalInflow}</strong> in
        total inflows and maintained a disciplined burn rate of {totalOutflow}. Retaining{" "}
        <strong style={{ color: "#0E1318" }}>{savingsRate}</strong> of your gross cash flow keeps
        you well ahead of your FIRE independence trajectory.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/cashflow`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Inspect cash flow breakdown
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/bills`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Set category budgets
          </EmailButton>
        </div>
      </Section>

      {/* Feature Cards with Colored Circular Icons */}
      <Heading
        as="h2"
        style={{
          fontSize: "19px",
          fontWeight: 800,
          color: "#0E1318",
          margin: "32px 0 16px 0",
          textAlign: "left",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Cash flow summary
      </Heading>

      <EmailFeatureCard
        icon="bank"
        title="Total Cash Inflows"
        badge={totalInflow}
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Inflow total: <strong style={{ color: "#0E1318" }}>{totalInflow}</strong>. Includes
            salary credit, interest earnings, and dividend distributions across all linked accounts.
          </>
        }
      />

      <EmailFeatureCard
        icon="bill"
        title="Total Living Expenses & Burn"
        badge={totalOutflow}
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Total outflows: <strong style={{ color: "#0E1318" }}>{totalOutflow}</strong>. Top
            spending category was {topSpendingCategory} ({topCategoryAmount}).
          </>
        }
      />

      <EmailFeatureCard
        icon="pie"
        title="Spending Velocity & Anomalies"
        badge={`${anomaliesDetected} Alert`}
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Discretionary dining & travel increased by 18% over your 3-month trailing average. Fixed
            commitments remained completely on budget.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How are portfolio returns and XIRR calculated?",
            href: `${emailConfig.docsUrl}/faq#how-are-portfolio-returns-and-xirr-calculated`,
          },
          {
            question: "What automated email digests does Selvam deliver?",
            href: `${emailConfig.docsUrl}/faq#what-automated-email-digests-does-selvam-deliver`,
          },
          {
            question: "How do I customize alert frequency or delivery channels?",
            href: `${emailConfig.docsUrl}/faq#how-do-i-customize-alert-frequency-or-delivery-channels`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const CashFlowDigestEmailPreview = () => (
  <CashFlowDigestEmail
    userName="Priya"
    monthName="Last Month"
    totalInflow="₹2,64,000"
    totalOutflow="₹1,21,200"
    netSaved="₹1,42,800"
    savingsRate="54%"
    topSpendingCategory="Housing & Utilities"
    topCategoryAmount="₹58,400"
    anomaliesDetected={1}
  />
);

export default CashFlowDigestEmail;
