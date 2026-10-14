import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface ContractItem {
  title: string;
  provider: string;
  renewalDate: string;
  daysUntilRenewal: number;
  monthlyCost?: string;
  status: "renewing_today" | "expired" | "expiring_soon" | "active";
  href?: string;
  description?: string;
}

export interface ContractsEmailProps {
  contracts: ContractItem[];
  totalContracts: number;
  expiringSoonCount: number;
  expiringTodayCount: number;
  expiredCount: number;
}

export function ContractsEmail({
  contracts,
  totalContracts,
  expiringSoonCount,
  expiringTodayCount,
  expiredCount,
}: ContractsEmailProps) {
  const companyName = emailConfig.appName;
  const hasUrgent = expiringTodayCount > 0 || expiredCount > 0;
  const titleText = hasUrgent
    ? "Action required: Contract renewal alerts."
    : "Upcoming contract renewal & notice period alerts.";

  return (
    <EmailLayout
      previewText={`${titleText} — ${totalContracts} contracts scheduled`}
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
        Annual and recurring agreements summary:
      </Text>

      {/* Big Stat Callout (Like Wise '1 EUR = 112.004 INR') */}
      <div
        style={{
          fontSize: "24px",
          fontWeight: 800,
          color: hasUrgent ? "#EA580C" : "#0E1318",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {expiringSoonCount > 0
          ? `${expiringSoonCount} Renewals in Notice Period · ${totalContracts} Active Contracts`
          : `${totalContracts} Active Contracts Monitored`}
      </div>

      {/* Vibrant Watercolor Hero Banner */}
      <EmailHeroBanner type="wealth" alt="Contract renewal alerts" />

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
        Many enterprise and consumer agreements automatically lock in for 12 months unless notice is
        served during the window. Review your notice dates below to prevent unwanted charges.
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/contracts`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Review all contracts
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/calendar`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Open renewal calendar
          </EmailButton>
        </div>
      </Section>

      {/* Individual Contract Cards with Circular Colored Icons */}
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
        Tracked contracts ({contracts.length})
      </Heading>

      {contracts.map((contract, index) => {
        let badgeText = `Renews ${contract.renewalDate}`;
        let badgeBg = "#F3F4F6";
        let badgeColor = "#374151";

        if (contract.status === "renewing_today") {
          badgeText = "Renews Today";
          badgeBg = "#FEE2E2";
          badgeColor = "#991B1B";
        } else if (contract.status === "expiring_soon") {
          badgeText = `${contract.daysUntilRenewal}d notice`;
          badgeBg = "#FFEDD5";
          badgeColor = "#9A3412";
        } else if (contract.status === "expired") {
          badgeText = "Expired";
          badgeBg = "#FEE2E2";
          badgeColor = "#DC2626";
        }

        return (
          <EmailFeatureCard
            key={index}
            icon="contract"
            title={contract.title}
            badge={badgeText}
            badgeBg={badgeBg}
            badgeColor={badgeColor}
            description={
              <>
                <strong style={{ color: "#0E1318", marginRight: "6px" }}>
                  {contract.provider}
                </strong>
                {contract.monthlyCost && <span> · {contract.monthlyCost}/mo</span>}
                {contract.description && (
                  <span style={{ color: "#6B7280" }}> — {contract.description}</span>
                )}
              </>
            }
          />
        );
      })}

      {/* Repeated Bottom Action Button */}
      <Section className="mt-6 mb-2 text-center">
        <EmailButton
          href={`${emailConfig.baseUrl}/dashboard/contracts`}
          variant="pill"
          size="md"
          fullWidth={true}
        >
          Manage contracts workspace
        </EmailButton>
      </Section>

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How do notice period reminders work?",
            href: `${emailConfig.docsUrl}/faq#notifications--digests`,
          },
          {
            question: "Can I import documents and past transactions?",
            href: `${emailConfig.docsUrl}/faq#can-i-import-past-transactions-via-excel-or-csv`,
          },
          {
            question: "How does Selvam protect my data and contracts?",
            href: `${emailConfig.docsUrl}/faq#how-does-selvam-protect-my-financial-data`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const ContractsEmailPreview = () => (
  <ContractsEmail
    contracts={[
      {
        title: "Apartment Lease Agreement",
        provider: "Prestige Estates",
        renewalDate: "2026-11-15",
        daysUntilRenewal: 32,
        monthlyCost: "₹45,000",
        status: "expiring_soon",
        description: "Requires 30 days prior written notice before auto-extension",
      },
      {
        title: "Health Insurance Family Floater",
        provider: "Care Health Insurance",
        renewalDate: "2026-12-01",
        daysUntilRenewal: 48,
        monthlyCost: "₹2,200",
        status: "active",
        description: "Sum insured: ₹25,00,000 with cumulative bonus",
      },
      {
        title: "Cloud Workspace Annual Subscription",
        provider: "Google Workspace Enterprise",
        renewalDate: "2026-10-31",
        daysUntilRenewal: 17,
        monthlyCost: "₹1,800",
        status: "expiring_soon",
        description: "5 seat business tier with 2TB pooled storage",
      },
    ]}
    totalContracts={3}
    expiringSoonCount={2}
    expiringTodayCount={0}
    expiredCount={0}
  />
);

export default ContractsEmail;
