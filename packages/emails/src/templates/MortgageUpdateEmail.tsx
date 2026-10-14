import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface MortgageUpdateEmailProps {
  userName?: string;
  lenderName?: string;
  monthlyEmi?: string;
  principalPaid?: string;
  interestPaid?: string;
  remainingPrincipal?: string;
  interestRate?: string;
  remainingMonths?: number;
  estimatedPrepaymentSavings?: string;
}

export function MortgageUpdateEmail({
  userName = "Priya",
  lenderName = "HDFC Bank Home Loans",
  monthlyEmi = "₹78,500",
  principalPaid = "₹28,340",
  interestPaid = "₹50,160",
  remainingPrincipal = "₹48,20,000",
  interestRate = "8.45% p.a.",
  remainingMonths = 142,
  estimatedPrepaymentSavings = "₹6,42,000",
}: MortgageUpdateEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Mortgage EMI of ${monthlyEmi} debited · Remaining principal balance: ${remainingPrincipal}`}
      title={`Home Loan Amortisation Update — ${companyName}`}
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
        Monthly home loan EMI debited.
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
        Mortgage amortisation update for this billing cycle:
      </Text>

      {/* Prominent Stat Callout */}
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#0E1318",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {monthlyEmi} debited · {remainingPrincipal} balance
      </div>

      {/* Vibrant Watercolor Alert Banner */}
      <EmailHeroBanner type="alert" alt="Home Loan EMI debited" />

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
        Hi {userName}, your monthly mortgage EMI to{" "}
        <strong style={{ color: "#0E1318" }}>{lenderName}</strong> has been debited. You have{" "}
        <strong style={{ color: "#0E1318" }}>{remainingMonths} months</strong> remaining. Making an
        annual 5% lump-sum principal prepayment can shave 3.8 years off your loan tenure.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/liabilities`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            View amortisation schedule
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/twin`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Simulate loan prepayment
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
        Mortgage amortisation summary
      </Heading>

      <EmailFeatureCard
        icon="bill"
        title="Principal Reduction This Month"
        badge={principalPaid}
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Direct debt reduction: <strong style={{ color: "#0E1318" }}>{principalPaid}</strong>.
            Outstanding principal reduced to {remainingPrincipal} at floating interest rate of{" "}
            {interestRate}.
          </>
        }
      />

      <EmailFeatureCard
        icon="chart"
        title="Interest Paid to Lender"
        badge={interestPaid}
        badgeBg="#FEE2E2"
        badgeColor="#991B1B"
        description={
          <>
            Interest charge: <strong style={{ color: "#0E1318" }}>{interestPaid}</strong>. Under
            Section 24(b) of the Income Tax Act, you can claim up to ₹2,00,000 in home loan interest
            deductions annually.
          </>
        }
      />

      <EmailFeatureCard
        icon="refresh"
        title="Prepayment Interest Savings"
        badge={`Save ${estimatedPrepaymentSavings}`}
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            A prepayment of ₹1,00,000 today saves approximately{" "}
            <strong style={{ color: "#0E1318" }}>{estimatedPrepaymentSavings}</strong> in
            compounding future interest over the remaining life of the loan.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How do mortgage amortisation and prepayment simulations work?",
            href: `${emailConfig.docsUrl}/faq#how-do-mortgage-amortisation-and-prepayment-simulations-work`,
          },
          {
            question: "Which financial assets can I track in Selvam?",
            href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
          },
          {
            question: "How does the tax engine handle cross-border residency?",
            href: `${emailConfig.docsUrl}/faq#how-does-the-tax-engine-handle-cross-border-residency`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const MortgageUpdateEmailPreview = () => (
  <MortgageUpdateEmail
    userName="Priya"
    lenderName="HDFC Bank Home Loans"
    monthlyEmi="₹78,500"
    principalPaid="₹28,340"
    interestPaid="₹50,160"
    remainingPrincipal="₹48,20,000"
    interestRate="8.45% p.a."
    remainingMonths={142}
    estimatedPrepaymentSavings="₹6,42,000"
  />
);

export default MortgageUpdateEmail;
