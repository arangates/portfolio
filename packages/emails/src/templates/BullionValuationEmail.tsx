import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface BullionValuationEmailProps {
  userName?: string;
  totalBullionValue?: string;
  monthlyGainPercent?: string;
  goldSpotPrice24k?: string;
  goldSpotPrice22k?: string;
  silverSpotPrice?: string;
  sgbHoldingsValue?: string;
  physicalGoldValue?: string;
  nextSgbCouponDate?: string;
}

export function BullionValuationEmail({
  userName = "Priya",
  totalBullionValue = "₹18,45,200",
  monthlyGainPercent = "+3.2%",
  goldSpotPrice24k = "₹7,820/g",
  goldSpotPrice22k = "₹7,165/g",
  silverSpotPrice = "₹94.50/g",
  sgbHoldingsValue = "₹7,25,200",
  physicalGoldValue = "₹11,20,000",
  nextSgbCouponDate = "15 November",
}: BullionValuationEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Bullion update: Precious metals portfolio valued at ${totalBullionValue} (${monthlyGainPercent} this month)`}
      title={`Bullion Valuation & Precious Metals Digest — ${companyName}`}
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
        Gold & precious metals valuation update.
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
        Portfolio bullion market valuation as of today:
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
        {totalBullionValue} ({monthlyGainPercent} this month)
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="Bullion & Gold Portfolio Update" />

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
        Hi {userName}, bullion markets have rallied. Spot 24K gold is currently trading at{" "}
        <strong style={{ color: "#0E1318" }}>{goldSpotPrice24k}</strong>. Your physical gold, silver
        bars, and RBI Sovereign Gold Bonds (SGB) continue to serve as a robust macro hedge against
        inflation and currency debasement.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/gold`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            View bullion portfolio
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/reports`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Download valuation report
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
        Metals breakdown & spot benchmarks
      </Heading>

      <EmailFeatureCard
        icon="vault"
        title="Physical Gold (24K & 22K)"
        badge={physicalGoldValue}
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Valuation: <strong style={{ color: "#0E1318" }}>{physicalGoldValue}</strong>. Spot 24K:{" "}
            {goldSpotPrice24k} · 22K: {goldSpotPrice22k}. Synced with national bullion association
            closing rates.
          </>
        }
      />

      <EmailFeatureCard
        icon="check"
        title="Sovereign Gold Bonds (SGB)"
        badge="2.5% Coupon"
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            SGB holdings: <strong style={{ color: "#0E1318" }}>{sgbHoldingsValue}</strong>. Next
            bi-annual interest coupon of 2.5% p.a. will credit to your account on{" "}
            {nextSgbCouponDate}. Tax-free on redemption.
          </>
        }
      />

      <EmailFeatureCard
        icon="chart"
        title="Silver Bullion & Spot Trend"
        badge={silverSpotPrice}
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Silver trading at <strong style={{ color: "#0E1318" }}>{silverSpotPrice}</strong>.
            Bullion holdings make up 12.8% of your overall net worth, maintaining optimal portfolio
            risk diversification.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How does Selvam track physical gold and SGBs?",
            href: `${emailConfig.docsUrl}/faq#how-does-selvam-track-physical-gold-sovereign-gold-bonds-sgb-and-bullion`,
          },
          {
            question: "Which financial assets can I track in Selvam?",
            href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
          },
          {
            question: "How are portfolio returns and XIRR calculated?",
            href: `${emailConfig.docsUrl}/faq#how-are-portfolio-returns-and-xirr-calculated`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const BullionValuationEmailPreview = () => (
  <BullionValuationEmail
    userName="Priya"
    totalBullionValue="₹18,45,200"
    monthlyGainPercent="+3.2%"
    goldSpotPrice24k="₹7,820/g"
    goldSpotPrice22k="₹7,165/g"
    silverSpotPrice="₹94.50/g"
    sgbHoldingsValue="₹7,25,200"
    physicalGoldValue="₹11,20,000"
    nextSgbCouponDate="15 November"
  />
);

export default BullionValuationEmail;
