import { Section, Column, Row } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailHeading, EmailSubheading, EmailBody, EmailCaption } from "../components/EmailText";
import { EmailButton } from "../components/EmailButton";
import { EmailCard } from "../components/EmailCard";
import { EmailDivider } from "../components/EmailDivider";
import { emailConfig } from "../config";

interface DepositItem {
  title: string;
  bank: string;
  maturityDate: string;
  daysUntilMaturity: number;
  amount: string;
  interestRate?: string;
  maturityAmount?: string;
  status: "maturing_today" | "matured" | "maturing_soon" | "active";
  href?: string;
  accountNumber?: string;
}

interface DepositsEmailProps {
  deposits: DepositItem[];
  totalDeposits: number;
  maturingTodayCount: number;
  maturedCount: number;
  maturingSoonCount: number;
  totalMaturityAmount: string;
}

export function DepositsEmail({
  deposits,
  totalDeposits,
  maturingTodayCount,
  maturedCount,
  maturingSoonCount,
  totalMaturityAmount,
}: DepositsEmailProps) {
  const hasUrgent = maturingTodayCount > 0 || maturedCount > 0;

  return (
    <EmailLayout
      previewText={`Deposit maturity alerts - ${totalDeposits} deposits need attention`}
      title={`Deposit Maturity Alerts - ${totalDeposits} deposits`}
    >
      {/* Header */}
      <Section style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            background: hasUrgent
              ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            borderRadius: "15px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "24px" }}>🏦</span>
        </div>

        <EmailHeading marginBottom="8px">
          {hasUrgent ? "Deposit Maturity Alerts" : "Upcoming Deposit Maturities"}
        </EmailHeading>

        <EmailBody color="#64748b" marginBottom="0">
          {totalDeposits} deposit{totalDeposits !== 1 ? "s" : ""} reaching maturity
        </EmailBody>
      </Section>

      {/* Alert Section for Urgent Deposits */}
      {hasUrgent && (
        <EmailCard padding="md" backgroundColor="#d1fae5" border={false}>
          <Row style={{ gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "20px" }}>✅</span>
            <Column>
              <EmailBody weight="bold" marginBottom="4px" color="#16a34a">
                Action Required: Deposits Available
              </EmailBody>
              <EmailCaption marginBottom="0">
                {maturingTodayCount > 0 &&
                  `${maturingTodayCount} deposit${maturingTodayCount > 1 ? "s" : ""} maturing today`}
                {maturingTodayCount > 0 && maturedCount > 0 && " and "}
                {maturedCount > 0 &&
                  `${maturedCount} matured deposit${maturedCount > 1 ? "s" : ""}`}
              </EmailCaption>
            </Column>
          </Row>
        </EmailCard>
      )}

      <EmailDivider />

      {/* Success Message for Matured Deposits */}
      {maturedCount > 0 && (
        <EmailCard padding="md" backgroundColor="#d1fae5" border={false}>
          <Row style={{ gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "20px" }}>🎉</span>
            <Column>
              <EmailBody weight="bold" marginBottom="4px" color="#16a34a">
                Congratulations! Your deposit{maturingTodayCount > 1 ? "s have" : " has"} matured
              </EmailBody>
              <EmailCaption marginBottom="0">
                Total maturity amount: <strong>{totalMaturityAmount}</strong>
              </EmailCaption>
            </Column>
          </Row>
        </EmailCard>
      )}

      <EmailDivider />

      {/* Deposits Summary */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailSubheading marginBottom="16px">Deposit Summary</EmailSubheading>

        <EmailCard padding="md">
          <Row style={{ gap: "16px", marginBottom: "16px" }}>
            <SummaryCard
              icon="🏦"
              title="Total Deposits"
              value={totalDeposits.toString()}
              color="#0f172a"
            />
            <SummaryCard
              icon="✅"
              title="Maturing Today"
              value={maturingTodayCount.toString()}
              color="#22c55e"
            />
            <SummaryCard
              icon="💰"
              title="Already Matured"
              value={maturedCount.toString()}
              color="#16a34a"
            />
            <SummaryCard
              icon="⏰"
              title="Maturing Soon"
              value={maturingSoonCount.toString()}
              color="#f59e0b"
            />
          </Row>

          <SummaryCard
            icon="💵"
            title="Total Maturity Value"
            value={totalMaturityAmount}
            color="#0f172a"
            wide
          />
        </EmailCard>
      </Section>

      <EmailDivider />

      {/* Deposits List */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailSubheading marginBottom="16px">All Deposits</EmailSubheading>

        {deposits.map((deposit, index) => (
          <DepositItemComponent
            key={`${deposit.title}-${deposit.maturityDate}-${index}`}
            deposit={deposit}
            isLast={index === deposits.length - 1}
          />
        ))}
      </Section>

      {/* Call to Action */}
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${emailConfig.baseUrl}/dashboard/deposits`} fullWidth={false}>
          Manage Deposits
        </EmailButton>

        <EmailCaption marginTop="12px">
          <a href={`${emailConfig.baseUrl}/dashboard/deposits`} style={{ color: "#0ea5e9" }}>
            {emailConfig.baseUrl}/dashboard/deposits
          </a>
        </EmailCaption>
      </Section>

      <EmailDivider />

      {/* Tips Section */}
      <Section style={{ textAlign: "center" }}>
        <EmailSubheading marginBottom="16px">Deposit Maturity Tips</EmailSubheading>

        <EmailCard padding="md" backgroundColor="#f8fafc">
          <Row style={{ gap: "20px" }}>
            <TipColumn
              icon="🔄"
              title="Reinvest"
              description="Consider reinvesting matured amounts for continued growth"
            />
            <TipColumn
              icon="📊"
              title="Compare Rates"
              description="Check current interest rates before renewing deposits"
            />
            <TipColumn
              icon="🎯"
              title="Financial Goals"
              description="Align deposit maturities with your financial objectives"
            />
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
  wide = false,
}: {
  icon: string;
  title: string;
  value: string;
  color: string;
  wide?: boolean;
}) {
  return (
    <Column style={{ textAlign: "center", width: wide ? "100%" : "auto" }}>
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

function TipColumn({
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
          width: "48px",
          height: "48px",
          backgroundColor: "#d1fae5",
          borderRadius: "12px",
          margin: "0 auto 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
        }}
      >
        {icon}
      </div>
      <EmailBody weight="bold" marginBottom="4px">
        {title}
      </EmailBody>
      <EmailCaption marginBottom="0" align="center">
        {description}
      </EmailCaption>
    </Column>
  );
}

function DepositItemComponent({ deposit, isLast }: { deposit: DepositItem; isLast: boolean }) {
  const getStatusConfig = () => {
    switch (deposit.status) {
      case "maturing_today":
        return { label: "MATURING TODAY", color: "#22c55e", bgColor: "#d1fae5" };
      case "matured":
        return { label: "MATURED", color: "#16a34a", bgColor: "#d1fae5" };
      case "maturing_soon":
        return {
          label: `MATURES IN ${deposit.daysUntilMaturity} DAYS`,
          color: "#f59e0b",
          bgColor: "#fef3c7",
        };
      case "active":
        return { label: "ACTIVE", color: "#3b82f6", bgColor: "#dbeafe" };
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
        {/* Deposit Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor:
              deposit.status === "matured" || deposit.status === "maturing_today"
                ? "#d1fae5"
                : "#e0f2fe",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          🏦
        </div>

        {/* Deposit Details */}
        <Column style={{ flex: 1 }}>
          <EmailBody weight="bold" marginBottom="4px">
            {deposit.title}
          </EmailBody>
          <EmailCaption marginBottom="4px">
            {deposit.bank} {deposit.accountNumber && `• ${deposit.accountNumber}`}
          </EmailCaption>

          <Row style={{ gap: "16px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📅</span>
              <EmailBody marginBottom="0" color="#0f172a">
                {deposit.maturityDate}
              </EmailBody>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>💰</span>
              <EmailBody marginBottom="0" color="#0f172a">
                {deposit.amount}
              </EmailBody>
            </div>
            {deposit.interestRate && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>📈</span>
                <EmailBody marginBottom="0" color="#0f172a">
                  {deposit.interestRate}
                </EmailBody>
              </div>
            )}
          </Row>

          {deposit.maturityAmount && (
            <EmailCaption marginTop="8px" marginBottom="0">
              Maturity Amount: <strong>{deposit.maturityAmount}</strong>
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

      {deposit.href && (
        <Row style={{ marginTop: "16px", justifyContent: "flex-end" }}>
          <EmailButton href={deposit.href} variant="outline" size="sm">
            View Deposit →
          </EmailButton>
        </Row>
      )}
    </EmailCard>
  );
}

// Preview component for development
export function DepositsEmailPreview() {
  const sampleDeposits: DepositItem[] = [
    {
      title: "Fixed Deposit Account",
      bank: "National Bank",
      maturityDate: new Date().toISOString().slice(0, 10),
      daysUntilMaturity: 0,
      status: "maturing_today",
      amount: "€10,000.00",
      interestRate: "5.25%",
      maturityAmount: "€10,525.00",
      accountNumber: "FD-2023-001234",
      href: "#",
    },
    {
      title: "Recurring Deposit",
      bank: "City Bank",
      maturityDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      daysUntilMaturity: -1,
      status: "matured",
      amount: "€5,000.00",
      interestRate: "4.75%",
      maturityAmount: "€5,237.50",
      accountNumber: "RD-2023-005678",
      href: "#",
    },
    {
      title: "Term Deposit",
      bank: "Investment Bank",
      maturityDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      daysUntilMaturity: 7,
      status: "maturing_soon",
      amount: "€7,500.00",
      interestRate: "6.00%",
      maturityAmount: "€7,650.00",
      accountNumber: "TD-2023-009012",
      href: "#",
    },
  ];

  return (
    <DepositsEmail
      deposits={sampleDeposits}
      totalDeposits={3}
      maturingTodayCount={1}
      maturedCount={1}
      maturingSoonCount={1}
      totalMaturityAmount="€23,412.50"
    />
  );
}

export default DepositsEmail;
