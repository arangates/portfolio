import { Section, Column, Row } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailHeading, EmailSubheading, EmailBody, EmailCaption } from "../components/EmailText";
import { EmailButton } from "../components/EmailButton";
import { EmailCard } from "../components/EmailCard";
import { EmailDivider } from "../components/EmailDivider";
import { emailConfig } from "../config";

interface BillItem {
  title: string;
  amount: string;
  dueDate: string;
  status: "due_today" | "overdue" | "upcoming" | "paid";
  account?: string;
  category?: string;
  href?: string;
}

interface BillsEmailProps {
  bills: BillItem[];
  totalAmount: string;
  dueTodayCount: number;
  overdueCount: number;
  upcomingCount: number;
}

export function BillsEmail({
  bills,
  totalAmount,
  dueTodayCount,
  overdueCount,
  upcomingCount,
}: BillsEmailProps) {
  const totalBills = bills.length;
  const hasUrgent = dueTodayCount > 0 || overdueCount > 0;

  return (
    <EmailLayout
      previewText={`You have ${totalBills} bills ${hasUrgent ? "that need attention" : "due soon"}`}
      title={`Bill Reminders - ${totalBills} ${totalBills === 1 ? "bill" : "bills"} due`}
    >
      {/* Header */}
      <Section style={{ textAlign: "center", marginBottom: "24px" }}>
        <div
          style={{
            width: "60px",
            height: "60px",
            background: hasUrgent
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            borderRadius: "15px",
            margin: "0 auto 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "24px" }}>💰</span>
        </div>

        <EmailHeading marginBottom="8px">
          {hasUrgent ? "Urgent: Bill Payment Reminders" : "Upcoming Bill Reminders"}
        </EmailHeading>

        <EmailBody color="#64748b" marginBottom="0">
          {totalBills} {totalBills === 1 ? "bill" : "bills"} need your attention
        </EmailBody>
      </Section>

      {/* Alert Section for Urgent Bills */}
      {hasUrgent && (
        <EmailCard padding="md" backgroundColor="#fef2f2" border={false}>
          <Row style={{ gap: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <Column>
              <EmailBody weight="bold" marginBottom="4px" color="#dc2626">
                Urgent Action Required
              </EmailBody>
              <EmailCaption marginBottom="0">
                {dueTodayCount > 0 &&
                  `${dueTodayCount} bill${dueTodayCount > 1 ? "s" : ""} due today`}
                {dueTodayCount > 0 && overdueCount > 0 && " and "}
                {overdueCount > 0 && `${overdueCount} overdue bill${overdueCount > 1 ? "s" : ""}`}
              </EmailCaption>
            </Column>
          </Row>
        </EmailCard>
      )}

      <EmailDivider />

      {/* Bills Summary */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailSubheading marginBottom="16px">Payment Summary</EmailSubheading>

        <EmailCard padding="md">
          <Row style={{ gap: "16px", marginBottom: "16px" }}>
            <SummaryCard icon="💰" title="Total Amount Due" value={totalAmount} color="#0f172a" />
            <SummaryCard
              icon="📅"
              title="Due Today"
              value={dueTodayCount.toString()}
              color="#dc2626"
            />
            <SummaryCard
              icon="⚠️"
              title="Overdue"
              value={overdueCount.toString()}
              color="#ea580c"
            />
            <SummaryCard
              icon="⏰"
              title="Upcoming"
              value={upcomingCount.toString()}
              color="#22c55e"
            />
          </Row>
        </EmailCard>
      </Section>

      <EmailDivider />

      {/* Bills List */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailSubheading marginBottom="16px">All Bills</EmailSubheading>

        {bills.map((bill, index) => (
          <BillItemComponent
            key={`${bill.title}-${bill.dueDate}-${index}`}
            bill={bill}
            isLast={index === bills.length - 1}
          />
        ))}
      </Section>

      {/* Call to Action */}
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${emailConfig.baseUrl}/dashboard/bills`} fullWidth={false}>
          Manage Bills
        </EmailButton>

        <EmailCaption marginTop="12px">
          <a href={`${emailConfig.baseUrl}/dashboard/bills`} style={{ color: "#0ea5e9" }}>
            {emailConfig.baseUrl}/dashboard/bills
          </a>
        </EmailCaption>
      </Section>

      <EmailDivider />

      {/* Help Section */}
      <Section style={{ textAlign: "center" }}>
        <EmailCaption color="#64748b">
          Need help with a bill?
          <a href="mailto:support@selvam.app" style={{ color: "#0ea5e9" }}>
            Contact support
          </a>
        </EmailCaption>
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

function BillItemComponent({ bill, isLast }: { bill: BillItem; isLast: boolean }) {
  const getStatusConfig = () => {
    switch (bill.status) {
      case "due_today":
        return { label: "DUE TODAY", color: "#dc2626", bgColor: "#fef2f2" };
      case "overdue":
        return { label: "OVERDUE", color: "#ea580c", bgColor: "#fff7ed" };
      case "upcoming":
        return { label: "UPCOMING", color: "#22c55e", bgColor: "#f0fdf4" };
      case "paid":
        return { label: "PAID", color: "#059669", bgColor: "#d1fae5" };
      default:
        return { label: "UPCOMING", color: "#64748b", bgColor: "#f8fafc" };
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
        {/* Status Badge */}
        <div
          style={{
            backgroundColor: status.bgColor,
            color: status.color,
            padding: "4px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {status.label}
        </div>

        {/* Bill Details */}
        <Column style={{ flex: 1 }}>
          <EmailBody weight="bold" marginBottom="4px">
            {bill.title}
          </EmailBody>
          <EmailCaption marginBottom="4px">{bill.category || "Bill"}</EmailCaption>

          <Row style={{ gap: "16px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>💰</span>
              <EmailBody marginBottom="0" color="#0f172a">
                {bill.amount}
              </EmailBody>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📅</span>
              <EmailBody marginBottom="0" color="#0f172a">
                {bill.dueDate}
              </EmailBody>
            </div>
            {bill.account && (
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>🏦</span>
                <EmailBody marginBottom="0" color="#64748b">
                  {bill.account}
                </EmailBody>
              </div>
            )}
          </Row>
        </Column>

        {/* Action Button */}
        {bill.href && (
          <EmailButton href={bill.href} variant="outline" style={{ flexShrink: 0 }}>
            Pay Now
          </EmailButton>
        )}
      </Row>
    </EmailCard>
  );
}

// Preview component for development
export function BillsEmailPreview() {
  const sampleBills: BillItem[] = [
    {
      title: "Electricity Bill",
      amount: "€120.50",
      dueDate: new Date().toISOString().slice(0, 10),
      status: "due_today",
      account: "Power Company",
      category: "Utilities",
      href: "#",
    },
    {
      title: "Internet Service",
      amount: "€45.00",
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "overdue",
      account: "Internet Provider",
      category: "Utilities",
      href: "#",
    },
    {
      title: "Credit Card Payment",
      amount: "€500.00",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "upcoming",
      account: "Bank of America",
      category: "Credit Cards",
      href: "#",
    },
    {
      title: "Insurance Premium",
      amount: "€200.00",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: "upcoming",
      account: "Insurance Co",
      category: "Insurance",
      href: "#",
    },
  ];

  return (
    <BillsEmail
      bills={sampleBills}
      totalAmount="€865.50"
      dueTodayCount={1}
      overdueCount={1}
      upcomingCount={2}
    />
  );
}

export default BillsEmail;
