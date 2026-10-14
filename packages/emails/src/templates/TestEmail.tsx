import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface TestEmailProps {
  email: string;
  userName?: string;
}

export const TestEmail = ({ email, userName }: TestEmailProps) => {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Test notification from ${companyName} — Delivery to ${email} verified`}
      title={`${companyName} email notifications are ready`}
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
        Your email notification system is operational.
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
        Verified delivery channel:
      </Text>

      {/* Big Stat Callout (Like Wise '1 EUR = 112.004 INR') */}
      <div
        style={{
          fontSize: "22px",
          fontWeight: 800,
          color: "#166534",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {email}
      </div>

      {/* Vibrant Watercolor Alert Banner */}
      <EmailHeroBanner type="alert" alt="Delivery test verified" />

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
        {userName ? `Hi ${userName}, ` : "Hi there, "}this test email confirms that your Resend and
        transactional delivery pipeline is fully configured. You will receive real-time financial
        alerts and periodic digests at this address.
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/settings`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Manage notification preferences
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Open portfolio dashboard
          </EmailButton>
        </div>
      </Section>

      {/* Feature Section with Colored Circular Icons */}
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
        Automated digests you can configure:
      </Heading>

      <EmailFeatureCard
        icon="bill"
        title="Recurring Bills & Utilities"
        badge="Active"
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description="Advance notice before electricity, water, internet, and credit card due dates."
      />

      <EmailFeatureCard
        icon="vault"
        title="Fixed Deposit Maturities"
        badge="Active"
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description="Maturity date and payout alerts with interest rate comparisons for seamless reinvestment."
      />

      <EmailFeatureCard
        icon="chart"
        title="Portfolio Valuation Digests"
        badge="Weekly"
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description="Consolidated summary of net worth changes, equity gainers, and mutual fund NAV movements."
      />

      <EmailFeatureCard
        icon="contract"
        title="Contract & Policy Notice Windows"
        badge="Scheduled"
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description="Never get locked into an unwanted auto-renewal on rental leases or insurance policies."
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How do I add a secondary email or WhatsApp alert number?",
            href: `${emailConfig.baseUrl}/dashboard/settings#contacts`,
          },
          {
            question: "What should I do if emails land in Spam or Promotions?",
            href: `${emailConfig.baseUrl}/faq#email-whitelisting`,
          },
          {
            question: "Can I receive instant alerts for large bank transactions?",
            href: `${emailConfig.baseUrl}/faq#transaction-alerts`,
          },
        ]}
      />
    </EmailLayout>
  );
};

export const TestEmailPreview = () => (
  <TestEmail email="developer@selvam.app" userName="Developer" />
);

export default TestEmail;
