import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface DividendPayoutEmailProps {
  userName?: string;
  totalDividendAmount?: string;
  holdingsCount?: number;
  topStockName?: string;
  topStockAmount?: string;
  tdsDeducted?: string;
  portfolioYield?: string;
  depositAccountLast4?: string;
}

export function DividendPayoutEmail({
  userName = "Priya",
  totalDividendAmount = "₹14,850",
  holdingsCount = 3,
  topStockName = "Tata Consultancy Services (TCS)",
  topStockAmount = "₹9,200",
  tdsDeducted = "₹1,485",
  portfolioYield = "2.8%",
  depositAccountLast4 = "8842",
}: DividendPayoutEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Dividend Alert: ${totalDividendAmount} credited from ${holdingsCount} portfolio holdings`}
      title={`Dividend Payout & Yield Digest — ${companyName}`}
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
        Dividend payout credited to your account.
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
        Equity dividend receipt confirmed to account (•••• {depositAccountLast4}):
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
        {totalDividendAmount} credited · {holdingsCount} holdings
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="Dividend Payout Credited" />

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
        Hi {userName}, your corporate dividend distributions have settled.{" "}
        <strong style={{ color: "#0E1318" }}>{topStockName}</strong> was the primary contributor
        with {topStockAmount}. Reinvesting passive cash payouts compounds your portfolio value over
        time.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/investments#dividends`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            View dividend ledger
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/investments`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Reinvest idle cash
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
        Dividend distributions
      </Heading>

      <EmailFeatureCard
        icon="chart"
        title="Top Dividend Contributors"
        badge={topStockAmount}
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Leading distribution: <strong style={{ color: "#0E1318" }}>{topStockName}</strong>{" "}
            credited {topStockAmount}. Balance distributed across your index ETF and dividend growth
            holdings.
          </>
        }
      />

      <EmailFeatureCard
        icon="shield"
        title="Statutory Withholding (10% TDS)"
        badge={`${tdsDeducted} TDS`}
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Tax deducted at source under Section 194:{" "}
            <strong style={{ color: "#0E1318" }}>{tdsDeducted}</strong>. This withholding will be
            reflected in your Form 26AS / AIS for year-end tax set-off.
          </>
        }
      />

      <EmailFeatureCard
        icon="refresh"
        title="Portfolio Dividend Yield on Cost"
        badge={`${portfolioYield} Yield`}
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Your equity portfolio generates an effective trailing yield of{" "}
            <strong style={{ color: "#0E1318" }}>{portfolioYield}</strong>, generating predictable
            passive cash flow toward financial independence.
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
            question: "Which financial assets can I track in Selvam?",
            href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const DividendPayoutEmailPreview = () => (
  <DividendPayoutEmail
    userName="Priya"
    totalDividendAmount="₹14,850"
    holdingsCount={3}
    topStockName="Tata Consultancy Services (TCS)"
    topStockAmount="₹9,200"
    tdsDeducted="₹1,485"
    portfolioYield="2.8%"
    depositAccountLast4="8842"
  />
);

export default DividendPayoutEmail;
