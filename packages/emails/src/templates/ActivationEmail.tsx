import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface ActivationEmailProps {
  companyName?: string;
  url: string;
}

export const ActivationEmail = ({
  companyName = emailConfig.appName,
  url,
}: ActivationEmailProps) => {
  return (
    <EmailLayout
      previewText={`Confirm your email address to activate your ${companyName} account`}
      title={`Confirm your email address — ${companyName}`}
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
        Confirm your email address to activate your account.
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
        Welcome to {companyName}. Confirm your email address below to unlock your unified financial
        portfolio and automated wealth digests.
      </Text>

      {/* Vibrant Watercolor Hero Banner with Circular Badge */}
      <EmailHeroBanner type="security" alt="Account verification" />

      {/* Explanatory Paragraph */}
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
        Once confirmed, you&apos;ll be able to link your bank accounts, track deposits and
        investments, and schedule smart bill reminders in one secure workspace.
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton href={url} variant="pill" size="md" fullWidth={true}>
            Confirm email address
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Go to dashboard
          </EmailButton>
        </div>
      </Section>

      <Text
        style={{
          fontSize: "12px",
          lineHeight: "1.5",
          color: "#6B7280",
          fontStyle: "italic",
          margin: "16px auto 32px auto",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        *If you did not sign up for an account with {companyName}, you can safely disregard this
        email.
      </Text>

      {/* Feature Section with Colored Circular Icons */}
      <Heading
        as="h2"
        style={{
          fontSize: "19px",
          fontWeight: 800,
          color: "#0E1318",
          margin: "32px 0 16px 0",
          textAlign: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        Why manage your wealth with{" "}
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
        icon="shield"
        title="Bank-grade 256-bit encryption"
        badge="Protected"
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            All credentials, banking tokens, and asset values are{" "}
            <strong style={{ color: "#0E1318" }}>secured with end-to-end encryption</strong> and
            never shared.
          </>
        }
      />

      <EmailFeatureCard
        icon="chart"
        title="Unified portfolio tracking"
        badge="Real-time"
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Track equities, mutual funds, gold, fixed deposits, and savings{" "}
            <strong style={{ color: "#0E1318" }}>in one clean, consolidated dashboard</strong>.
          </>
        }
      />

      <EmailFeatureCard
        icon="bell"
        title="Proactive reminder alerts"
        badge="Automated"
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Never miss an upcoming bill payment, contract auto-renewal, or{" "}
            <strong style={{ color: "#0E1318" }}>deposit maturity payout date</strong>.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How long is this verification link valid?",
            href: `${emailConfig.docsUrl}/faq#how-do-i-activate-my-account`,
          },
          {
            question: "What financial assets can I track on Selvam?",
            href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
          },
          {
            question: "How does Selvam protect my privacy and financial data?",
            href: `${emailConfig.docsUrl}/faq#how-does-selvam-protect-my-financial-data`,
          },
        ]}
      />
    </EmailLayout>
  );
};

export const ActivationEmailPreview = () => (
  <ActivationEmail
    companyName="Selvam"
    url="http://localhost:3001/auth/verify?token=preview_token_12345"
  />
);

export const ConfirmEmail = ActivationEmail;
export default ActivationEmail;
