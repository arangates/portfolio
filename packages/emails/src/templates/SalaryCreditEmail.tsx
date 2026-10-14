import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface SalaryCreditEmailProps {
  userName?: string;
  employerName?: string;
  netSalary?: string;
  grossSalary?: string;
  tdsWithheld?: string;
  pfDeduction?: string;
  depositDate?: string;
  bankAccountLast4?: string;
  scheduledSipAmount?: string;
}

export function SalaryCreditEmail({
  userName = "Priya",
  employerName = "Technology Solutions B.V.",
  netSalary = "₹2,15,400",
  grossSalary = "₹2,75,000",
  tdsWithheld = "₹42,600",
  pfDeduction = "₹17,000",
  depositDate = "Last working day of the month",
  bankAccountLast4 = "8842",
  scheduledSipAmount = "₹85,000",
}: SalaryCreditEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Monthly salary of ${netSalary} credited from ${employerName}`}
      title={`Salary Credit & Allocation Digest — ${companyName}`}
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
        Monthly salary credited & reconciled.
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
        Net deposit confirmed to your primary account (•••• {bankAccountLast4}):
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
        {netSalary} credited
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="Monthly Salary Credited" />

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
        Hi {userName}, your salary from <strong style={{ color: "#0E1318" }}>{employerName}</strong>{" "}
        has arrived. Your automated investment pipelines are queued:{" "}
        <strong style={{ color: "#0E1318" }}>{scheduledSipAmount}</strong> will be deployed into
        your mutual fund SIPs and emergency reserves over the next 48 hours.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/transactions`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Review salary breakdown
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/investments`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Adjust auto-invest allocations
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
        Payroll & tax deductions
      </Heading>

      <EmailFeatureCard
        icon="bank"
        title="Gross Earnings & Net Take-Home"
        badge={netSalary}
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Gross salary: <strong style={{ color: "#0E1318" }}>{grossSalary}</strong>. Net payout of{" "}
            {netSalary} settled on {depositDate} via direct bank clearing rail.
          </>
        }
      />

      <EmailFeatureCard
        icon="shield"
        title="Statutory Withholdings (TDS & PF)"
        badge={`${tdsWithheld} TDS`}
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            TDS deducted: <strong style={{ color: "#0E1318" }}>{tdsWithheld}</strong> · Provident
            Fund contribution: <strong style={{ color: "#0E1318" }}>{pfDeduction}</strong>. All
            statutory tax credits have been logged to your annual tax ledger.
          </>
        }
      />

      <EmailFeatureCard
        icon="refresh"
        title="Automated Savings & SIP Rule"
        badge={`${scheduledSipAmount} Queued`}
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Auto-invest rule: <strong style={{ color: "#0E1318" }}>39.5% savings rate</strong>. Your
            pre-configured SIP debits will trigger automatically between the 1st and 5th of next
            month.
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
            question: "How does the tax engine handle cross-border residency?",
            href: `${emailConfig.docsUrl}/faq#how-does-the-tax-engine-handle-cross-border-residency`,
          },
          {
            question: "Can I import past transactions via Excel or CSV?",
            href: `${emailConfig.docsUrl}/faq#can-i-import-past-transactions-via-excel-or-csv`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const SalaryCreditEmailPreview = () => (
  <SalaryCreditEmail
    userName="Priya"
    employerName="Technology Solutions B.V."
    netSalary="₹2,15,400"
    grossSalary="₹2,75,000"
    tdsWithheld="₹42,600"
    pfDeduction="₹17,000"
    depositDate="30th of this month"
    bankAccountLast4="8842"
    scheduledSipAmount="₹85,000"
  />
);

export default SalaryCreditEmail;
