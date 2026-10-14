import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface InvestmentItem {
  title: string;
  symbol: string;
  type: "Stock" | "Mutual Fund" | "ETF" | "Bond" | "Crypto" | "Real Estate";
  currentValue: string;
  changeAmount: string;
  changePercent: string;
  targetPrice?: string;
  status: "gaining" | "losing" | "stable" | "target_reached" | "alert";
  href?: string;
  news?: string;
}

export interface InvestmentsEmailProps {
  investments: InvestmentItem[];
  totalPortfolioValue: string;
  dailyChange: string;
  dailyChangePercent: string;
  gainingCount: number;
  losingCount: number;
  alertsCount: number;
}

export function InvestmentsEmail({
  investments,
  totalPortfolioValue,
  dailyChange,
  dailyChangePercent,
  gainingCount,
  losingCount,
  alertsCount,
}: InvestmentsEmailProps) {
  const companyName = emailConfig.appName;
  const isPositive = !dailyChangePercent.startsWith("-");
  const titleText =
    alertsCount > 0
      ? "Investment alerts & portfolio performance update."
      : "Your investment portfolio performance update.";

  return (
    <EmailLayout
      previewText={`${titleText} — ${totalPortfolioValue} (${dailyChange})`}
      title={titleText}
      companyName={companyName}
      showWordmark={true}
    >
      {/* Bold Main Headline (Wise Style) */}
      <Heading
        as="h1"
        style={{
          fontSize: "26px",
          fontWeight: 800,
          lineHeight: "1.25",
          letterSpacing: "-0.5px",
          color: "#0E1318",
          margin: "12px 0 8px 0",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {titleText}
      </Heading>

      <Text
        style={{
          fontSize: "14.5px",
          lineHeight: "1.5",
          color: "#596066",
          margin: "0 auto 12px auto",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Consolidated portfolio valuation as of market close:
      </Text>

      {/* Big Stat Callout (Like Wise '1 EUR = 112.004 INR') */}
      <div
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "#0E1318",
          textAlign: "center",
          margin: "0 0 10px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {totalPortfolioValue}
      </div>

      {/* 24h Change Pill Badge */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "9999px",
            fontSize: "13px",
            fontWeight: 700,
            backgroundColor: isPositive ? "#DCFCE7" : "#FEE2E2",
            color: isPositive ? "#166534" : "#991B1B",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {dailyChange} ({dailyChangePercent}) today
        </span>
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="Investment portfolio performance" />

      {/* Body Copy */}
      <Text
        style={{
          fontSize: "14.5px",
          lineHeight: "1.6",
          color: "#374151",
          margin: "0 auto 24px auto",
          maxWidth: "480px",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Across your tracked portfolio,{" "}
        <strong style={{ color: "#166534" }}>{gainingCount} assets gained</strong> and{" "}
        <strong style={{ color: "#DC2626" }}>{losingCount} moved lower</strong>. Your holdings are
        automatically benchmarked against Nifty 50 and global indices.
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/investments`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            View full portfolio
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Review asset allocation
          </EmailButton>
        </div>
      </Section>

      {/* Individual Investment Asset Cards with Circular Chart/Pie Icons */}
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
        Top holdings breakdown ({investments.length})
      </Heading>

      {investments.map((inv, index) => {
        const itemPositive = !inv.changePercent.startsWith("-");
        const badgeBg = itemPositive ? "#DCFCE7" : "#FEE2E2";
        const badgeColor = itemPositive ? "#166534" : "#991B1B";
        const iconType = inv.type === "Mutual Fund" || inv.type === "ETF" ? "pie" : "chart";

        return (
          <EmailFeatureCard
            key={index}
            icon={iconType}
            title={`${inv.title} (${inv.symbol})`}
            badge={inv.changePercent}
            badgeBg={badgeBg}
            badgeColor={badgeColor}
            description={
              <>
                <strong style={{ color: "#0E1318", marginRight: "6px" }}>{inv.currentValue}</strong>
                <span>{inv.type}</span>
                {inv.news && <span style={{ color: "#6B7280" }}> — {inv.news}</span>}
              </>
            }
          />
        );
      })}

      {/* Repeated Bottom Action Button */}
      <Section className="mt-6 mb-2 text-center">
        <EmailButton
          href={`${emailConfig.baseUrl}/dashboard/investments`}
          variant="pill"
          size="md"
          fullWidth={true}
        >
          Open investments workspace
        </EmailButton>
      </Section>

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How frequently are live stock and mutual fund prices updated?",
            href: `${emailConfig.baseUrl}/faq#price-updates`,
          },
          {
            question: "Can I connect Zerodha Kite, Groww, or Upstox directly?",
            href: `${emailConfig.baseUrl}/faq#broker-integrations`,
          },
          {
            question: "How is portfolio XIRR and annualized return calculated?",
            href: `${emailConfig.baseUrl}/faq#xirr-calculations`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const InvestmentsEmailPreview = () => (
  <InvestmentsEmail
    investments={[
      {
        title: "Reliance Industries Ltd",
        symbol: "RELIANCE.BSE",
        type: "Stock",
        currentValue: "₹4,85,200",
        changeAmount: "+₹12,400",
        changePercent: "+2.6%",
        status: "gaining",
        news: "Strong Q2 retail and telecoms EBITDA growth",
      },
      {
        title: "Parag Parikh Flexi Cap Fund",
        symbol: "PPFAS-DIR",
        type: "Mutual Fund",
        currentValue: "₹8,40,000",
        changeAmount: "+₹6,800",
        changePercent: "+0.8%",
        status: "gaining",
        news: "Top decile 5-year rolling return in flexi cap category",
      },
      {
        title: "Tata Consultancy Services",
        symbol: "TCS.BSE",
        type: "Stock",
        currentValue: "₹3,12,000",
        changeAmount: "-₹4,100",
        changePercent: "-1.3%",
        status: "losing",
        news: "IT index margin caution amidst deal cycle elongation",
      },
    ]}
    totalPortfolioValue="₹32,45,800"
    dailyChange="+₹15,100"
    dailyChangePercent="+0.47%"
    gainingCount={2}
    losingCount={1}
    alertsCount={0}
  />
);

export default InvestmentsEmail;
