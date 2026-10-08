import { Section, Column, Row } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailHeading, EmailSubheading, EmailBody, EmailCaption } from "../components/EmailText";
import { EmailButton } from "../components/EmailButton";
import { EmailCard } from "../components/EmailCard";
import { EmailDivider } from "../components/EmailDivider";
import { emailConfig } from "../config";

interface WelcomeEmailProps {
  userName: string;
  email: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <EmailLayout
      previewText={`Welcome to ${emailConfig.appName}, ${userName}!`}
      title={`Welcome to ${emailConfig.appName}`}
    >
      {/* Hero Section */}
      <Section style={{ textAlign: "center", marginBottom: "32px" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
            borderRadius: "20px",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "32px" }}>👋</span>
        </div>

        <EmailHeading marginBottom="8px">
          Welcome to {emailConfig.appName}, {userName}!
        </EmailHeading>

        <EmailBody color="#64748b" marginBottom="0">
          We're excited to have you on board! 🎉
        </EmailBody>
      </Section>

      <EmailDivider />

      {/* Features Section */}
      <Section style={{ marginBottom: "32px" }}>
        <EmailSubheading marginBottom="20px" align="center">
          Manage Your Entire Financial Life
        </EmailSubheading>

        <EmailCard padding="md">
          <Row style={{ gap: "16px", marginBottom: "24px" }}>
            <FeatureCard
              icon="📊"
              title="Comprehensive Portfolio"
              description="Track stocks, mutual funds, real estate, cryptocurrencies, and more in one place"
            />
            <FeatureCard
              icon="💡"
              title="AI-Powered Insights"
              description="Get intelligent recommendations and financial analysis"
            />
            <FeatureCard
              icon="📈"
              title="Automated Tracking"
              description="Import transactions and sync with your accounts automatically"
            />
          </Row>

          <Row style={{ gap: "16px" }}>
            <FeatureCard
              icon="🔄"
              title="Cash Flow Analysis"
              description="Monitor income, expenses, and financial health over time"
            />
            <FeatureCard
              icon="📅"
              title="Smart Reminders"
              description="Never miss a bill, contract renewal, or investment opportunity"
            />
            <FeatureCard
              icon="💬"
              title="AI Financial Assistant"
              description="Ask questions and get personalized financial advice"
            />
          </Row>
        </EmailCard>
      </Section>

      <EmailDivider />

      {/* Quick Start Section */}
      <Section style={{ marginBottom: "32px" }}>
        <EmailSubheading marginBottom="20px">Quick Start Guide</EmailSubheading>

        <EmailCard padding="md" backgroundColor="#f8fafc">
          <Step
            number={1}
            title="Complete Your Profile"
            description="Set up your financial information and preferences"
          />
        </EmailCard>

        <EmailCard padding="md" backgroundColor="#f8fafc" style={{ marginTop: "16px" }}>
          <Step
            number={2}
            title="Add Your Accounts"
            description="Connect bank accounts, investments, and other financial data"
          />
        </EmailCard>

        <EmailCard padding="md" backgroundColor="#f8fafc" style={{ marginTop: "16px" }}>
          <Step
            number={3}
            title="Set Up Notifications"
            description="Enable email reminders for bills, contracts, and important dates"
          />
        </EmailCard>

        <EmailCard padding="md" backgroundColor="#f8fafc" style={{ marginTop: "16px" }}>
          <Step
            number={4}
            title="Explore Your Dashboard"
            description="Discover all the features and customize your view"
          />
        </EmailCard>
      </Section>

      {/* Call to Action */}
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${emailConfig.baseUrl}/dashboard`} fullWidth={false}>
          Get Started with {emailConfig.appName}
        </EmailButton>

        <EmailCaption marginTop="12px">
          <a href={`${emailConfig.baseUrl}/dashboard`} style={{ color: "#0ea5e9" }}>
            {emailConfig.baseUrl}/dashboard
          </a>
        </EmailCaption>
      </Section>

      <EmailDivider />

      {/* Support Section */}
      <Section style={{ textAlign: "center" }}>
        <EmailSubheading marginBottom="16px">Need Help?</EmailSubheading>

        <EmailBody marginBottom="24px">
          Our support team is here to help you get the most out of {emailConfig.appName}.
        </EmailBody>

        <Row style={{ justifyContent: "center", gap: "16px" }}>
          <EmailButton href="mailto:support@selvam.app" variant="outline">
            Contact Support
          </EmailButton>
          <EmailButton href={`${emailConfig.baseUrl}/docs`} variant="outline">
            View Documentation
          </EmailButton>
        </Row>
      </Section>

      {/* Footer Message */}
      <Section style={{ textAlign: "center", marginTop: "32px" }}>
        <EmailCaption color="#64748b">
          We're committed to your financial success. Start organizing your financial life today!
        </EmailCaption>
      </Section>
    </EmailLayout>
  );
}

function FeatureCard({
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
          width: "60px",
          height: "60px",
          background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
          borderRadius: "15px",
          margin: "0 auto 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
        }}
      >
        {icon}
      </div>
      <EmailBody weight="bold" marginBottom="8px">
        {title}
      </EmailBody>
      <EmailCaption marginBottom="0" align="center">
        {description}
      </EmailCaption>
    </Column>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <Row style={{ gap: "20px", alignItems: "flex-start" }}>
      <div
        style={{
          width: "40px",
          height: "40px",
          background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: "bold",
          fontSize: "18px",
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <Column>
        <EmailBody weight="bold" marginBottom="4px">
          {title}
        </EmailBody>
        <EmailCaption marginBottom="0">{description}</EmailCaption>
      </Column>
    </Row>
  );
}

// Preview component for development
export function WelcomeEmailPreview() {
  return <WelcomeEmail userName="John Doe" email="john@example.com" />;
}

export default WelcomeEmail;
