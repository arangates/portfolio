import { Section, Column, Row } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailHeading, EmailSubheading, EmailBody, EmailCaption } from "../components/EmailText";
import { EmailButton } from "../components/EmailButton";
import { EmailCard } from "../components/EmailCard";
import { EmailDivider } from "../components/EmailDivider";
import { emailConfig } from "../config";

interface InvestmentItem {
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

interface InvestmentsEmailProps {
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
  const hasAlerts = alertsCount > 0;
  const isPositive = parseFloat(dailyChangePercent.replace(/[^\d.-]/g, "")) >= 0;

  return (
    <EmailLayout
      previewText={`Investment updates - Portfolio: ${totalPortfolioValue} (${dailyChange})`}
      title={`Investment Portfolio Update`}
    >
      {/* Header */}
      <Section style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            background: hasAlerts
              ? "linear-gradient(135deg, #ea580c 0%, #dc2626 100%)"
              : isPositive
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            borderRadius: "15px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "24px" }}>📈</span>
        </div>

        <EmailHeading marginBottom="8px">
          {hasAlerts ? "Investment Alerts & Updates" : "Investment Portfolio Update"}
        </EmailHeading>

        <EmailBody color="#64748b" marginBottom="0">
          {investments.length} investments • {gainingCount} gaining • {losingCount} losing
        </EmailBody>
      </Section>

      {/* Portfolio Summary */}
      <EmailCard padding="md">
        <Section style={{ marginBottom: "24px" }}>
          <EmailSubheading marginBottom="16px">Portfolio Overview</EmailSubheading>

          <Row style={{ gap: "16px", marginBottom: "16px" }}>
            <SummaryCard
              icon="💰"
              title="Total Value"
              value={totalPortfolioValue}
              color="#0f172a"
              wide
            />
            <SummaryCard
              icon={isPositive ? "📈" : "📉"}
              title="Daily Change"
              value={dailyChange}
              color={isPositive ? "#22c55e" : "#dc2626"}
            />
            <SummaryCard
              icon="📊"
              title="Change %"
              value={dailyChangePercent}
              color={isPositive ? "#22c55e" : "#dc2626"}
            />
          </Row>

          <Row style={{ gap: "16px" }}>
            <SummaryCard
              icon="📈"
              title="Gaining"
              value={gainingCount.toString()}
              color="#22c55e"
            />
            <SummaryCard icon="📉" title="Losing" value={losingCount.toString()} color="#dc2626" />
            {hasAlerts && (
              <SummaryCard
                icon="⚠️"
                title="Alerts"
                value={alertsCount.toString()}
                color="#ea580c"
              />
            )}
          </Row>
        </Section>
      </EmailCard>

      <EmailDivider />

      {/* Investments List */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailSubheading marginBottom="16px">Portfolio Performance</EmailSubheading>

        {investments.map((investment, index) => (
          <InvestmentItemComponent
            key={`${investment.symbol}-${index}`}
            investment={investment}
            isLast={index === investments.length - 1}
          />
        ))}
      </Section>

      {/* Alerts Section */}
      {hasAlerts && (
        <>
          <EmailDivider />
          <Section style={{ marginBottom: "24px" }}>
            <EmailSubheading marginBottom="16px">⚠️ Investment Alerts</EmailSubheading>
            <EmailCard padding="md" backgroundColor="#fff7ed">
              <EmailBody marginBottom="8px">
                {alertsCount} investment{alertsCount > 1 ? "s require" : " requires"} your attention
              </EmailBody>
              <EmailCaption marginBottom="0">
                Review the highlighted investments above for important updates
              </EmailCaption>
            </EmailCard>
          </Section>
        </>
      )}

      {/* Call to Action */}
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${emailConfig.baseUrl}/dashboard`} fullWidth={false}>
          View Portfolio Dashboard
        </EmailButton>

        <EmailCaption marginTop="12px">
          <a href={`${emailConfig.baseUrl}/dashboard`} style={{ color: "#0ea5e9" }}>
            {emailConfig.baseUrl}/dashboard
          </a>
        </EmailCaption>
      </Section>

      <EmailDivider />

      {/* Market Insights */}
      <Section style={{ textAlign: "center" }}>
        <EmailSubheading marginBottom="16px">Market Insights</EmailSubheading>

        <EmailCard padding="md" backgroundColor="#f8fafc">
          <Row style={{ gap: "20px" }}>
            <InsightColumn
              icon="📊"
              title="Diversification"
              description="Spread investments across different asset classes"
            />
            <InsightColumn
              icon="🎯"
              title="Goals"
              description="Regularly review and rebalance your portfolio"
            />
            <InsightColumn
              icon="📈"
              title="Trends"
              description="Monitor market trends and adjust strategy accordingly"
            />
          </Row>
        </EmailCard>
      </Section>
    </EmailLayout>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  color,
  wide = false,
}: {
  icon: string;
  title: string;
  value: string;
  color: string;
  wide?: boolean;
}) {
  return (
    <Column style={{ textAlign: "center", width: wide ? "100%" : "auto" }}>
      <div
        style={{
          backgroundColor: color === "#0f172a" ? "#f8fafc" : color + "20",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "8px",
        }}
      >
        <div style={{ fontSize: "20px", marginBottom: "8px" }}>{icon}</div>
        <EmailHeading variant="h3" color={color} marginBottom="0">
          {value}
        </EmailHeading>
        <EmailCaption marginBottom="0">{title}</EmailCaption>
      </div>
    </Column>
  );
}

function InsightColumn({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Column style={{ textAlign: "center", padding: "16px" }}>
      <div
        style={{
          width: "48px",
          height: "48px",
          backgroundColor: "#e0f2fe",
          borderRadius: "12px",
          margin: "0 auto 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        {icon}
      </div>
      <EmailBody weight="bold" marginBottom="4px">
        {title}
      </EmailBody>
      <EmailCaption marginBottom="0" align="center">
        {description}
      </EmailCaption>
    </Column>
  );
}

function InvestmentItemComponent({
  investment,
  isLast,
}: {
  investment: InvestmentItem;
  isLast: boolean;
}) {
  const isPositive = investment.changePercent.startsWith("+");
  const isStable = investment.status === "stable";
  const hasTarget = investment.targetPrice && investment.status === "target_reached";
  const hasNews = investment.news && investment.news.length > 0;

  return (
    <EmailCard
      padding="md"
      border={true}
      backgroundColor="#ffffff"
      style={{ marginBottom: isLast ? "0" : "16px" }}
    >
      <Row style={{ gap: "16px", alignItems: "flex-start" }}>
        {/* Investment Icon/Color */}
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: hasTarget
              ? "#d1fae5"
              : isStable
                ? "#fef3c7"
                : isPositive
                  ? "#d1fae5"
                  : "#fee2e2",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          {investment.type === "Stock" && "📈"}
          {investment.type === "Mutual Fund" && "💼"}
          {investment.type === "ETF" && "🏛️"}
          {investment.type === "Bond" && "🏦"}
          {investment.type === "Crypto" && "₿"}
          {investment.type === "Real Estate" && "🏠"}
        </div>

        {/* Investment Details */}
        <Column style={{ flex: 1 }}>
          <EmailBody weight="bold" marginBottom="4px">
            {investment.title} ({investment.symbol})
          </EmailBody>
          <EmailCaption marginBottom="4px">{investment.type}</EmailCaption>

          <Row style={{ gap: "16px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>💰</span>
              <EmailBody marginBottom="0" color="#0f172a">
                {investment.currentValue}
              </EmailBody>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>{isPositive ? "📈" : "📉"}</span>
              <EmailBody marginBottom="0" color={isPositive ? "#22c55e" : "#dc2626"}>
                {investment.changeAmount} ({investment.changePercent})
              </EmailBody>
            </div>
          </Row>

          {hasTarget && investment.targetPrice && (
            <EmailCaption marginTop="8px" marginBottom="0">
              Target reached: <strong>{investment.targetPrice}</strong>
            </EmailCaption>
          )}

          {hasNews && investment.news && (
            <EmailCaption marginTop="8px" marginBottom="0">
              News: {investment.news}
            </EmailCaption>
          )}
        </Column>

        {/* Status Badge */}
        <div
          style={{
            backgroundColor: hasTarget
              ? "#d1fae5"
              : isStable
                ? "#fef3c7"
                : isPositive
                  ? "#d1fae5"
                  : "#fee2e2",
            color: hasTarget
              ? "#16a34a"
              : isStable
                ? "#d97706"
                : isPositive
                  ? "#16a34a"
                  : "#dc2626",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {hasTarget ? "TARGET" : isStable ? "STABLE" : isPositive ? "GAINING" : "LOSING"}
        </div>
      </Row>

      {investment.href && (
        <Row style={{ marginTop: "16px", justifyContent: "flex-end" }}>
          <EmailButton href={investment.href} variant="outline" size="sm">
            View Investment →
          </EmailButton>
        </Row>
      )}
    </EmailCard>
  );
}

// Preview component for development
export function InvestmentsEmailPreview() {
  const sampleInvestments: InvestmentItem[] = [
    {
      title: "Apple Inc.",
      symbol: "AAPL",
      type: "Stock",
      currentValue: "$175.50",
      changeAmount: "+$2.35",
      changePercent: "+1.36%",
      status: "gaining",
      href: "#",
    },
    {
      title: "S&P 500 Index Fund",
      symbol: "SPY",
      type: "ETF",
      currentValue: "$425.75",
      changeAmount: "+$4.25",
      changePercent: "+1.01%",
      status: "gaining",
      href: "#",
    },
    {
      title: "Tech Growth Fund",
      symbol: "TGF",
      type: "Mutual Fund",
      currentValue: "$85.30",
      changeAmount: "-$0.85",
      changePercent: "-0.99%",
      status: "losing",
      targetPrice: "$90.00",
      href: "#",
    },
    {
      title: "Bitcoin",
      symbol: "BTC",
      type: "Crypto",
      currentValue: "$52,345.00",
      changeAmount: "+$1,234.00",
      changePercent: "+2.41%",
      status: "gaining",
      news: "Institutional adoption increasing",
      href: "#",
    },
    {
      title: "Downtown Office Property",
      symbol: "RE-001",
      type: "Real Estate",
      currentValue: "$1,250,000",
      changeAmount: "$0.00",
      changePercent: "0.00%",
      status: "stable",
      href: "#",
    },
  ];

  return (
    <InvestmentsEmail
      investments={sampleInvestments}
      totalPortfolioValue="$45,825.45"
      dailyChange="+$245.80"
      dailyChangePercent="+0.54%"
      gainingCount={3}
      losingCount={1}
      alertsCount={1}
    />
  );
}

export default InvestmentsEmail;
