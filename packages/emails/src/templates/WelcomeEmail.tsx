import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface WelcomeEmailProps {
  userName: string;
  email: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Welcome to ${companyName}, ${userName}! Your intelligent portfolio is ready.`}
      title={`Welcome to ${companyName}, ${userName}`}
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
        Welcome to {companyName}, {userName}!
      </Heading>

      <Text
        style={{
          fontSize: "15px",
          lineHeight: "1.5",
          color: "#596066",
          margin: "0 auto 20px auto",
          maxWidth: "460px",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Your unified financial portfolio is now active. Explore your consolidated net worth, link
        accounts, and automate smart reminders.
      </Text>

      {/* Vibrant Watercolor Hero Banner with Growth Badge */}
      <EmailHeroBanner type="wealth" alt="Welcome to Selvam" />

      {/* Body Copy */}
      <Text
        style={{
          fontSize: "14.5px",
          lineHeight: "1.6",
          color: "#374151",
          margin: "0 auto 20px auto",
          maxWidth: "480px",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Managing multiple bank accounts, fixed deposits, stocks, and recurring bills can be
        overwhelming. {companyName} brings clarity to your personal finance with real-time valuation
        and automated reminders.
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Get started with {companyName}
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/settings`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Configure notification preferences
          </EmailButton>
        </div>
      </Section>

      {/* Feature Section with Colored Circular Icons (Wise Style) */}
      <Heading
        as="h2"
        style={{
          fontSize: "19px",
          fontWeight: 800,
          color: "#0E1318",
          margin: "36px 0 16px 0",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Why track your wealth with{" "}
        <span
          style={{
            backgroundColor: "#FFF3C4",
            padding: "2px 8px",
            borderRadius: "4px",
            color: "#163300",
          }}
        >
          {companyName}
        </span>
      </Heading>

      <EmailFeatureCard
        icon="users"
        title="Fair prices, no hidden fees"
        badge="Zero Commission"
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Unlike traditional advisors,{" "}
            <strong style={{ color: "#0E1318" }}>we charge zero hidden fees</strong>, and we provide
            100% transparent tracking of your assets and liabilities.
          </>
        }
      />

      <EmailFeatureCard
        icon="bank"
        title="Unified banking & investments"
        badge="All-in-One"
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Seamlessly view bank balances, fixed deposits, equities, and gold in{" "}
            <strong style={{ color: "#0E1318" }}>
              one consolidated, real-time portfolio dashboard
            </strong>
            .
          </>
        }
      />

      <EmailFeatureCard
        icon="refresh"
        title="Trusted by smart investors"
        badge="Automated"
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Over <strong style={{ color: "#0E1318" }}>10,000+ financial alerts and digests</strong>{" "}
            delivered on time, keeping members ahead of maturity dates and bill deadlines.
          </>
        }
      />

      {/* Repeated Bottom Action Button */}
      <Section className="mt-6 mb-2 text-center">
        <EmailButton
          href={`${emailConfig.baseUrl}/dashboard`}
          variant="pill"
          size="md"
          fullWidth={true}
        >
          Open your dashboard
        </EmailButton>
      </Section>

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How do I link my bank accounts and portfolios?",
            href: `${emailConfig.baseUrl}/faq#linking-accounts`,
          },
          {
            question: "Can I import existing data from Excel or CSV?",
            href: `${emailConfig.baseUrl}/faq#importing-data`,
          },
          {
            question: "How do I set up automated bill and deposit alerts?",
            href: `${emailConfig.baseUrl}/faq#configuring-alerts`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const WelcomeEmailPreview = () => (
  <WelcomeEmail userName="Alexander" email="alexander@selvam.app" />
);

export default WelcomeEmail;
