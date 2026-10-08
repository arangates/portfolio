import { Section, Column, Row } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailHeading, EmailSubheading, EmailBody, EmailCaption } from "../components/EmailText";
import { EmailButton } from "../components/EmailButton";
import { EmailCard } from "../components/EmailCard";
import { EmailDivider } from "../components/EmailDivider";
import { emailConfig } from "../config";

interface TestEmailProps {
  email: string;
  userName?: string;
}

export function TestEmail({ email, userName }: TestEmailProps) {
  return (
    <EmailLayout
      previewText="Test email notification from Selvam"
      title="Selvam email notifications are ready"
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
          <span style={{ color: "white", fontSize: "32px" }}>📧</span>
        </div>

        <EmailHeading marginBottom="8px">Email Notifications Are Ready!</EmailHeading>

        <EmailBody color="#64748b" marginBottom="0">
          {userName ? `Hi ${userName},` : "Hi there,"}
        </EmailBody>
      </Section>

      <EmailDivider />

      {/* Features Section */}
      <Section style={{ marginBottom: "32px" }}>
        <EmailSubheading marginBottom="20px">You'll receive notifications for:</EmailSubheading>

        <Row style={{ gap: "16px", marginBottom: "24px" }}>
          <FeatureColumn icon="💰" title="Bills" description="Payment due dates" />
          <FeatureColumn icon="📋" title="Contracts" description="Renewal reminders" />
          <FeatureColumn icon="🏦" title="Deposits" description="Maturity alerts" />
        </Row>

        <Row style={{ gap: "16px", marginBottom: "24px" }}>
          <FeatureColumn icon="📈" title="Investments" description="Market updates" />
          <FeatureColumn icon="💵" title="Salary" description="Payment notifications" />
          <FeatureColumn icon="🧾" title="Tax" description="Filing deadlines" />
        </Row>

        <Row style={{ gap: "16px" }}>
          <FeatureColumn icon="📅" title="Planning" description="Scheduled events" />
          <FeatureColumn icon="🛒" title="Purchases" description="Transaction alerts" />
          <FeatureColumn icon="📥" title="Imports" description="Data sync updates" />
        </Row>
      </Section>

      <EmailDivider />

      {/* What's Next Section */}
      <Section style={{ marginBottom: "32px" }}>
        <EmailSubheading marginBottom="16px">What happens next?</EmailSubheading>

        <EmailCard padding="md" backgroundColor="#f8fafc">
          <div style={{ display: "flex", gap: "20px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#0ea5e9",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              1
            </div>
            <div>
              <EmailBody weight="bold" marginBottom="4px">
                Enable email notifications in your settings
              </EmailBody>
              <EmailCaption marginBottom="0">
                Go to Settings &gt; Notifications and enable email delivery
              </EmailCaption>
            </div>
          </div>
        </EmailCard>

        <EmailCard padding="md" backgroundColor="#f8fafc" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "20px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#22c55e",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              2
            </div>
            <div>
              <EmailBody weight="bold" marginBottom="4px">
                Start receiving scheduled reminders
              </EmailBody>
              <EmailCaption marginBottom="0">
                Get daily or weekly financial reminders via email
              </EmailCaption>
            </div>
          </div>
        </EmailCard>

        <EmailCard padding="md" backgroundColor="#f8fafc" style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", gap: "20px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#8b5cf6",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              3
            </div>
            <div>
              <EmailBody weight="bold" marginBottom="4px">
                Customize your notification preferences
              </EmailBody>
              <EmailCaption marginBottom="0">
                Choose which categories you want to receive via email
              </EmailCaption>
            </div>
          </div>
        </EmailCard>
      </Section>

      {/* Call to Action */}
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${emailConfig.baseUrl}/dashboard/settings`} fullWidth={false}>
          Go to Notification Settings
        </EmailButton>
      </Section>

      <EmailDivider />

      {/* Summary Section */}
      <Section style={{ textAlign: "center" }}>
        <EmailCaption color="#64748b" marginBottom="16px">
          You're receiving this test email to confirm that your email address ({email}) is properly
          configured.
        </EmailCaption>

        <EmailCaption color="#64748b">
          If you didn't request this email, you can safely ignore it.
        </EmailCaption>
      </Section>
    </EmailLayout>
  );
}

function FeatureColumn({
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
          fontSize: "32px",
          marginBottom: "8px",
        }}
      >
        {icon}
      </div>
      <EmailBody weight="bold" marginBottom="4px">
        {title}
      </EmailBody>
      <EmailCaption marginBottom="0">{description}</EmailCaption>
    </Column>
  );
}

// Preview component for development
export function TestEmailPreview() {
  return <TestEmail email="user@example.com" userName="John Doe" />;
}

export default TestEmail;
