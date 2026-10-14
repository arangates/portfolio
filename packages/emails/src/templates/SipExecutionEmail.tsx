import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface SipExecutionEmailProps {
  userName?: string;
  totalDeployed?: string;
  fundsCount?: number;
  topFundName?: string;
  topFundAllocation?: string;
  executionDate?: string;
  overallXirr?: string;
  unitsAllottedSummary?: string;
}

export function SipExecutionEmail({
  userName = "Priya",
  totalDeployed = "₹45,000",
  fundsCount = 4,
  topFundName = "Parag Parikh Flexi Cap Direct-Growth",
  topFundAllocation = "₹20,000",
  executionDate = "5th of this month",
  overallXirr = "16.4%",
  unitsAllottedSummary = "182.42 units across 4 folios",
}: SipExecutionEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`SIP Execution: ${totalDeployed} deployed into ${fundsCount} mutual funds`}
      title={`SIP Auto-Debit & Allotment Confirmation — ${companyName}`}
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
        Automated SIP executed successfully.
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
        Systematic Investment Plan auto-debit confirmed:
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
        {totalDeployed} deployed · {fundsCount} funds
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="Mutual Fund SIP Executed" />

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
        Hi {userName}, your monthly systematic investments executed on {executionDate}. All mutual
        fund units have been allotted at current market closing NAVs. Systematic investing keeps
        your capital consistently compounding regardless of short-term volatility.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/investments`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            View mutual fund portfolio
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/investments#sips`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Manage active SIPs
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
        SIP execution details
      </Heading>

      <EmailFeatureCard
        icon="check"
        title="Units Allotted & Settled"
        badge="T+1 Settled"
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Allotment summary: <strong style={{ color: "#0E1318" }}>{unitsAllottedSummary}</strong>.
            Stamp duty and AMC transaction charges have been factored into final unit calculations.
          </>
        }
      />

      <EmailFeatureCard
        icon="chart"
        title="Largest Allocation"
        badge={topFundAllocation}
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Primary fund: <strong style={{ color: "#0E1318" }}>{topFundName}</strong> allocated{" "}
            {topFundAllocation}. Balance deployed into Large Cap Index and International Equity
            ETFs.
          </>
        }
      />

      <EmailFeatureCard
        icon="vault"
        title="Rupee Cost Averaging & Performance"
        badge={`${overallXirr} XIRR`}
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Your systematic discipline has yielded an annualized portfolio return of{" "}
            <strong style={{ color: "#0E1318" }}>{overallXirr}</strong>, outpacing broad market
            indices over rolling 3-year periods.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How are SIP executions and mutual fund NAVs reconciled?",
            href: `${emailConfig.docsUrl}/faq#how-are-sip-executions-and-mutual-fund-navs-reconciled`,
          },
          {
            question: "How are portfolio returns and XIRR calculated?",
            href: `${emailConfig.docsUrl}/faq#how-are-portfolio-returns-and-xirr-calculated`,
          },
          {
            question: "Which financial assets can I track in Selvam?",
            href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const SipExecutionEmailPreview = () => (
  <SipExecutionEmail
    userName="Priya"
    totalDeployed="₹45,000"
    fundsCount={4}
    topFundName="Parag Parikh Flexi Cap Direct-Growth"
    topFundAllocation="₹20,000"
    executionDate="5th of this month"
    overallXirr="16.4%"
    unitsAllottedSummary="182.42 units across 4 folios"
  />
);

export default SipExecutionEmail;
