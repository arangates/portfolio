import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface DocumentExpiryEmailProps {
  userName?: string;
  documentTitle?: string;
  documentCategory?: string;
  expiryDate?: string;
  daysRemaining?: number;
  identifierOrPolicyNo?: string;
  issuingAuthority?: string;
  gracePeriodNotice?: string;
}

export function DocumentExpiryEmail({
  userName = "Priya",
  documentTitle = "Term Life Insurance Policy",
  documentCategory = "Insurance & Risk",
  expiryDate = "28 November",
  daysRemaining = 30,
  identifierOrPolicyNo = "POL-8492041",
  issuingAuthority = "HDFC Life Insurance Co.",
  gracePeriodNotice = "30-day grace period applies after renewal date",
}: DocumentExpiryEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Action Required: Your ${documentTitle} expires on ${expiryDate} (${daysRemaining} days remaining)`}
      title={`Document Renewal Notice — ${companyName}`}
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
        Important document renewal reminder.
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
        Upcoming expiration notice for your {documentCategory}:
      </Text>

      {/* Prominent Stat Callout */}
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#991B1B",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {documentTitle} · {daysRemaining} days left
      </div>

      {/* Vibrant Watercolor Alert Banner */}
      <EmailHeroBanner type="alert" alt="Document Expiry Reminder" />

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
        Hi {userName}, your <strong style={{ color: "#0E1318" }}>{documentTitle}</strong> issued by{" "}
        {issuingAuthority} is due for renewal on {expiryDate}. Renewing before the expiry deadline
        prevents coverage lapses and avoids re-underwriting penalties.
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/documents`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            View document vault
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/documents#upload`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Update renewal details
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
        Document status & renewal checklist
      </Heading>

      <EmailFeatureCard
        icon="contract"
        title="Document Identifier & Expiry"
        badge={expiryDate}
        badgeBg="#FEE2E2"
        badgeColor="#991B1B"
        description={
          <>
            Reference: <strong style={{ color: "#0E1318" }}>{identifierOrPolicyNo}</strong>.
            Official expiration scheduled for {expiryDate} ({daysRemaining} days remaining).
          </>
        }
      />

      <EmailFeatureCard
        icon="shield"
        title="Coverage Continuity & Grace Period"
        badge="Active Grace"
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            {gracePeriodNotice}. Keeping policies active ensures unbroken financial protection for
            your dependents without additional medical checks.
          </>
        }
      />

      <EmailFeatureCard
        icon="users"
        title="Issuing Authority & Portal"
        badge="Online Portal"
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Issued by <strong style={{ color: "#0E1318" }}>{issuingAuthority}</strong>. You can
            complete the payment or document submission online, then upload the updated receipt
            directly to Selvam.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How does Selvam handle document and insurance expiry notifications?",
            href: `${emailConfig.docsUrl}/faq#how-does-selvam-handle-document-and-insurance-expiry-notifications`,
          },
          {
            question: "How does Selvam protect my financial data?",
            href: `${emailConfig.docsUrl}/faq#how-does-selvam-protect-my-financial-data`,
          },
          {
            question: "How do I customize alert frequency or delivery channels?",
            href: `${emailConfig.docsUrl}/faq#how-do-i-customize-alert-frequency-or-delivery-channels`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const DocumentExpiryEmailPreview = () => (
  <DocumentExpiryEmail
    userName="Priya"
    documentTitle="Term Life Insurance Policy"
    documentCategory="Insurance & Risk"
    expiryDate="28 November"
    daysRemaining={30}
    identifierOrPolicyNo="POL-8492041"
    issuingAuthority="HDFC Life Insurance Co."
    gracePeriodNotice="30-day grace period applies after renewal date"
  />
);

export default DocumentExpiryEmail;
