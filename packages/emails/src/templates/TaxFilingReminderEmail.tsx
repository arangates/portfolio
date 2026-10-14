import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface TaxFilingReminderEmailProps {
  userName?: string;
  taxQuarter?: string;
  dueDate?: string;
  daysRemaining?: number;
  estimatedTaxPayable?: string;
  assessmentYear?: string;
  totalIncomeYtd?: string;
  deductionsClaimed?: string;
}

export function TaxFilingReminderEmail({
  userName = "Priya",
  taxQuarter = "Q3 (October - December)",
  dueDate = "15 December",
  daysRemaining = 7,
  estimatedTaxPayable = "₹64,200",
  assessmentYear = "AY 2026-27",
  totalIncomeYtd = "₹28,50,000",
  deductionsClaimed = "₹2,50,000",
}: TaxFilingReminderEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Tax Reminder: ${taxQuarter} advance tax installment of ${estimatedTaxPayable} due in ${daysRemaining} days`}
      title={`Quarterly Advance Tax Reminder — ${companyName}`}
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
        Quarterly advance tax installment due.
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
        Statutory compliance deadline for {taxQuarter}:
      </Text>

      {/* Prominent Stat Callout */}
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#991B1B",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {estimatedTaxPayable} due by {dueDate} ({daysRemaining} days left)
      </div>

      {/* Vibrant Watercolor Security Banner */}
      <EmailHeroBanner type="security" alt="Advance Tax Filing Reminder" />

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
        Hi {userName}, for {assessmentYear}, your estimated cumulative tax liability requires paying{" "}
        <strong style={{ color: "#0E1318" }}>75% of total tax</strong> by {dueDate}. Paying on time
        avoids penal interest charges under Section 234B and 234C of the Income Tax Act.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/tax`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Review tax computations
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href="https://eportal.incometax.gov.in"
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Pay on Income Tax e-Portal
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
        Tax computation & deductions
      </Heading>

      <EmailFeatureCard
        icon="calendar"
        title="Statutory Installment Schedule"
        badge={dueDate}
        badgeBg="#FEE2E2"
        badgeColor="#991B1B"
        description={
          <>
            Installment due: <strong style={{ color: "#0E1318" }}>{estimatedTaxPayable}</strong>.
            Failure to remit by {dueDate} attracts 1% per month simple interest under Section 234C.
          </>
        }
      />

      <EmailFeatureCard
        icon="shield"
        title="Income YTD & Capital Gains"
        badge={totalIncomeYtd}
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Taxable earnings YTD: <strong style={{ color: "#0E1318" }}>{totalIncomeYtd}</strong>,
            incorporating realized short-term capital gains (STCG) and foreign exchange adjustments.
          </>
        }
      />

      <EmailFeatureCard
        icon="check"
        title="Exemptions & Deductions Claimed"
        badge={deductionsClaimed}
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Utilized deductions: <strong style={{ color: "#0E1318" }}>{deductionsClaimed}</strong>{" "}
            across Section 80C (PPF/ELSS), 80D (Health Insurance), and NPS Tier-1 (80CCD 1B).
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How does the tax engine handle cross-border residency?",
            href: `${emailConfig.docsUrl}/faq#how-does-the-tax-engine-handle-cross-border-residency`,
          },
          {
            question: "How does Selvam protect my financial data?",
            href: `${emailConfig.docsUrl}/faq#how-does-selvam-protect-my-financial-data`,
          },
          {
            question: "What automated email digests does Selvam deliver?",
            href: `${emailConfig.docsUrl}/faq#what-automated-email-digests-does-selvam-deliver`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const TaxFilingReminderEmailPreview = () => (
  <TaxFilingReminderEmail
    userName="Priya"
    taxQuarter="Q3 (October - December)"
    dueDate="15 December"
    daysRemaining={7}
    estimatedTaxPayable="₹64,200"
    assessmentYear="AY 2026-27"
    totalIncomeYtd="₹28,50,000"
    deductionsClaimed="₹2,50,000"
  />
);

export default TaxFilingReminderEmail;
