import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface CurrencyAlertEmailProps {
  targetRate: string;
  currentRate: string;
  baseCurrency?: string;
  targetCurrency?: string;
  timestamp?: string;
  comparisonAmount?: string;
  convertedAmount?: string;
  rateChange30d?: string;
  high30d?: string;
  low30d?: string;
}

export function CurrencyAlertEmail({
  targetRate,
  currentRate,
  baseCurrency = "EUR",
  targetCurrency = "INR",
  timestamp = "09:15 GMT today",
  comparisonAmount = "1,000 EUR",
  convertedAmount = "112,004 INR",
  rateChange30d = "+2.4%",
  high30d = "112.45",
  low30d = "108.90",
}: CurrencyAlertEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`The exchange rate you wanted has been reached: 1 ${baseCurrency} = ${currentRate} ${targetCurrency}`}
      title={`Exchange rate reached: 1 ${baseCurrency} = ${currentRate} ${targetCurrency}`}
      companyName={companyName}
      showWordmark={true}
    >
      {/* Bold Main Headline (1:1 with Wise Reference) */}
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
        The exchange rate you wanted has been reached.
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
        The exchange rate at {timestamp} was:
      </Text>

      {/* Prominent Stat Callout (Like Wise '1 EUR = 112.004 INR') */}
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
        1 {baseCurrency} = {currentRate} {targetCurrency}
      </div>

      {/* Vibrant Watercolor Alert Banner with Bell Badge */}
      <EmailHeroBanner type="alert" alt="Currency target rate reached" />

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
        Based on this rate, if you converted {comparisonAmount}, you&apos;d get{" "}
        <strong style={{ color: "#0E1318" }}>{convertedAmount}</strong>. When you set up your
        remittance or hedging order, fees remain upfront and transparent.
      </Text>

      <Text
        style={{
          fontSize: "14px",
          lineHeight: "1.6",
          color: "#4B5563",
          margin: "0 auto 24px auto",
          maxWidth: "480px",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Exchange rates move continuously. If you need time to transfer funds between accounts,
        create your order now to lock in this favorable rate window.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/eur`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Review & convert currency
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/settings#notifications`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Manage rate alerts
          </EmailButton>
        </div>
      </Section>

      <Text
        style={{
          fontSize: "12px",
          lineHeight: "1.5",
          color: "#6B7280",
          fontStyle: "italic",
          margin: "12px auto 32px auto",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        *Exchange rates vary depending on payment rails, banking intermediaries, and settlement
        hours.
      </Text>

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
        Currency market context
      </Heading>

      <EmailFeatureCard
        icon="chart"
        title="30-Day Rate Momentum"
        badge={rateChange30d}
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            30-day high:{" "}
            <strong style={{ color: "#0E1318" }}>
              {high30d} {targetCurrency}
            </strong>{" "}
            · 30-day low: {low30d} {targetCurrency}. Current level represents an optimal
            cross-border conversion point.
          </>
        }
      />

      <EmailFeatureCard
        icon="refresh"
        title="Zero Markup Remittance"
        badge="Best Rate"
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Unlike high-street banks charging 2.5% FX markups,{" "}
            <strong style={{ color: "#0E1318" }}>
              {companyName} benchmarks the mid-market rate
            </strong>{" "}
            for transparent wealth transfers.
          </>
        }
      />

      <EmailFeatureCard
        icon="bell"
        title="Target Threshold Notifications"
        badge="Automated"
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Your alert for <strong style={{ color: "#0E1318" }}>{targetRate}</strong> triggered
            automatically. You can configure additional upper and lower volatility bounds anytime.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How does multi-currency conversion work?",
            href: `${emailConfig.docsUrl}/faq#how-does-multi-currency-conversion-work`,
          },
          {
            question: "How do I configure currency target alerts?",
            href: `${emailConfig.docsUrl}/faq#how-do-i-customize-alert-frequency-or-delivery-channels`,
          },
          {
            question: "How does the cross-border tax engine handle FX gains?",
            href: `${emailConfig.docsUrl}/faq#how-does-the-tax-engine-handle-cross-border-residency`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const CurrencyAlertEmailPreview = () => (
  <CurrencyAlertEmail
    targetRate="112.00"
    currentRate="112.004"
    baseCurrency="EUR"
    targetCurrency="INR"
    timestamp="09:13 GMT today"
    comparisonAmount="1,000 EUR"
    convertedAmount="112,004 INR"
    rateChange30d="+2.4%"
    high30d="112.45"
    low30d="108.90"
  />
);

export default CurrencyAlertEmail;
