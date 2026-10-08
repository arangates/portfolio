import { Section, Column, Row } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailHeading, EmailSubheading, EmailBody, EmailCaption } from "../components/EmailText";
import { EmailButton } from "../components/EmailButton";
import { EmailCard } from "../components/EmailCard";
import { EmailDivider } from "../components/EmailDivider";
import { emailConfig } from "../config";

interface ContractItem {
  title: string;
  provider: string;
  renewalDate: string;
  daysUntilRenewal: number;
  monthlyCost?: string;
  status: "renewing_today" | "expired" | "expiring_soon" | "active";
  href?: string;
  description?: string;
}

interface ContractsEmailProps {
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
  const hasUrgent = expiringTodayCount > 0 || expiredCount > 0;

  return (
    <EmailLayout
      previewText={`Contract renewal alerts - ${totalContracts} contracts need attention`}
      title={`Contract Renewal Alerts - ${totalContracts} contracts`}
    >
      {/* Header */}
      <Section style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            background: hasUrgent
              ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: "15px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "24px" }}>📋</span>
        </div>

        <EmailHeading marginBottom="8px">
          {hasUrgent ? "Urgent: Contract Renewal Alerts" : "Contract Renewal Reminders"}
        </EmailHeading>

        <EmailBody color="#64748b" marginBottom="0">
          {totalContracts} contract{totalContracts !== 1 ? "s" : ""} need your review
        </EmailBody>
      </Section>

      {/* Alert Section for Urgent Contracts */}
      {hasUrgent && (
        <EmailCard padding="md" backgroundColor="#fef3c7" border={false}>
          <Row style={{ gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "20px" }}>⏰</span>
            <Column>
              <EmailBody weight="bold" marginBottom="4px" color="#ea580c">
                Immediate Action Required
              </EmailBody>
              <EmailCaption marginBottom="0">
                {expiringTodayCount > 0 &&
                  `${expiringTodayCount} contract${expiringTodayCount > 1 ? "s" : ""} expiring today`}
                {expiringTodayCount > 0 && expiredCount > 0 && " and "}
                {expiredCount > 0 &&
                  `${expiredCount} expired contract${expiredCount > 1 ? "s" : ""}`}
              </EmailCaption>
            </Column>
          </Row>
        </EmailCard>
      )}

      <EmailDivider />

      {/* Contracts Summary */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailSubheading marginBottom="16px">Contract Summary</EmailSubheading>

        <EmailCard padding="md">
          <Row style={{ gap: "16px", marginBottom: "16px" }}>
            <SummaryCard
              icon="📋"
              title="Total Contracts"
              value={totalContracts.toString()}
              color="#0f172a"
            />
            <SummaryCard
              icon="⏰"
              title="Expiring Today"
              value={expiringTodayCount.toString()}
              color="#dc2626"
            />
            <SummaryCard
              icon="⚠️"
              title="Expired"
              value={expiredCount.toString()}
              color="#ea580c"
            />
            <SummaryCard
              icon="🔔"
              title="Expiring Soon"
              value={expiringSoonCount.toString()}
              color="#f59e0b"
            />
          </Row>
        </EmailCard>
      </Section>

      <EmailDivider />

      {/* Contracts List */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailSubheading marginBottom="16px">All Contracts</EmailSubheading>

        {contracts.map((contract, index) => (
          <ContractItemComponent
            key={`${contract.title}-${contract.renewalDate}-${index}`}
            contract={contract}
            isLast={index === contracts.length - 1}
          />
        ))}
      </Section>

      {/* Call to Action */}
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${emailConfig.baseUrl}/dashboard/contracts`} fullWidth={false}>
          Manage Contracts
        </EmailButton>

        <EmailCaption marginTop="12px">
          <a href={`${emailConfig.baseUrl}/dashboard/contracts`} style={{ color: "#0ea5e9" }}>
            {emailConfig.baseUrl}/dashboard/contracts
          </a>
        </EmailCaption>
      </Section>

      <EmailDivider />

      {/* Tips Section */}
      <Section style={{ textAlign: "center" }}>
        <EmailSubheading marginBottom="16px">Tips for Contract Management</EmailSubheading>

        <EmailCard padding="md" backgroundColor="#f8fafc">
          <Row style={{ gap: "20px" }}>
            <Column>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "20px",
                }}
              >
                📅
              </div>
              <EmailBody weight="bold" marginBottom="4px" align="center">
                Set Reminders
              </EmailBody>
              <EmailCaption marginBottom="0" align="center">
                Add renewal reminders 30, 15, and 7 days before
              </EmailCaption>
            </Column>
            <Column>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "20px",
                }}
              >
                💰
              </div>
              <EmailBody weight="bold" marginBottom="4px" align="center">
                Compare Costs
              </EmailBody>
              <EmailCaption marginBottom="0" align="center">
                Review if current contracts offer best value
              </EmailCaption>
            </Column>
            <Column>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  backgroundColor: "#dbeafe",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  fontSize: "20px",
                }}
              >
                📋
              </div>
              <EmailBody weight="bold" marginBottom="4px" align="center">
                Organize
              </EmailBody>
              <EmailCaption marginBottom="0" align="center">
                Categorize contracts by type and priority
              </EmailCaption>
            </Column>
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
}: {
  icon: string;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <Column style={{ textAlign: "center" }}>
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

function ContractItemComponent({ contract, isLast }: { contract: ContractItem; isLast: boolean }) {
  const getStatusConfig = () => {
    switch (contract.status) {
      case "renewing_today":
        return { label: "RENEWING TODAY", color: "#dc2626", bgColor: "#fef2f2" };
      case "expired":
        return { label: "EXPIRED", color: "#ea580c", bgColor: "#fff7ed" };
      case "expiring_soon":
        return {
          label: `EXPIRES IN ${contract.daysUntilRenewal} DAYS`,
          color: "#f59e0b",
          bgColor: "#fef3c7",
        };
      case "active":
        return { label: "ACTIVE", color: "#22c55e", bgColor: "#f0fdf4" };
      default:
        return { label: "ACTIVE", color: "#64748b", bgColor: "#f8fafc" };
    }
  };

  const status = getStatusConfig();

  return (
    <EmailCard
      padding="md"
      border={true}
      backgroundColor="#ffffff"
      style={{ marginBottom: isLast ? "0" : "16px" }}
    >
      <Row style={{ gap: "16px", alignItems: "flex-start" }}>
        {/* Contract Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: "#e0f2fe",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          📋
        </div>

        {/* Contract Details */}
        <Column style={{ flex: 1 }}>
          <EmailBody weight="bold" marginBottom="4px">
            {contract.title}
          </EmailBody>
          <EmailCaption marginBottom="4px">{contract.provider}</EmailCaption>

          <Row style={{ gap: "16px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📅</span>
              <EmailBody marginBottom="0" color="#0f172a">
                {contract.renewalDate}
              </EmailBody>
            </div>
            {contract.monthlyCost && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>💰</span>
                <EmailBody marginBottom="0" color="#0f172a">
                  {contract.monthlyCost}/mo
                </EmailBody>
              </div>
            )}
          </Row>

          {contract.description && (
            <EmailCaption marginTop="8px" marginBottom="0">
              {contract.description}
            </EmailCaption>
          )}
        </Column>

        {/* Status Badge */}
        <div
          style={{
            backgroundColor: status.bgColor,
            color: status.color,
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {status.label}
        </div>
      </Row>

      {contract.href && (
        <Row style={{ marginTop: "16px", justifyContent: "flex-end" }}>
          <EmailButton href={contract.href} variant="outline" size="sm">
            Manage Contract →
          </EmailButton>
        </Row>
      )}
    </EmailCard>
  );
}

// Preview component for development
export function ContractsEmailPreview() {
  const sampleContracts: ContractItem[] = [
    {
      title: "Mobile Phone Plan",
      provider: "Telecom Pro",
      renewalDate: new Date().toISOString().slice(0, 10),
      daysUntilRenewal: 0,
      status: "renewing_today",
      monthlyCost: "€29.99",
      description: "Unlimited calls and data",
      href: "#",
    },
    {
      title: "Internet Service",
      provider: "NetConnect",
      renewalDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      daysUntilRenewal: -1,
      status: "expired",
      monthlyCost: "€45.00",
      description: "500 Mbps fiber connection",
      href: "#",
    },
    {
      title: "Gym Membership",
      provider: "FitLife Gym",
      renewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      daysUntilRenewal: 3,
      status: "expiring_soon",
      monthlyCost: "€35.00",
      description: "Premium membership with all access",
      href: "#",
    },
    {
      title: "Streaming Service",
      provider: "StreamFlix",
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      daysUntilRenewal: 30,
      status: "active",
      monthlyCost: "€12.99",
      description: "4K streaming with multiple profiles",
      href: "#",
    },
  ];

  return (
    <ContractsEmail
      contracts={sampleContracts}
      totalContracts={4}
      expiringSoonCount={1}
      expiringTodayCount={1}
      expiredCount={1}
    />
  );
}

export default ContractsEmail;
