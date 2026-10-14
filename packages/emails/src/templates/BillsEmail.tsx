import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface BillItem {
  title: string;
  amount: string;
  dueDate: string;
  status: "due_today" | "overdue" | "upcoming" | "paid";
  account?: string;
  category?: string;
  href?: string;
}

export interface BillsEmailProps {
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
  const companyName = emailConfig.appName;
  const totalBills = bills.length;
  const hasUrgent = dueTodayCount > 0 || overdueCount > 0;

  const titleText = hasUrgent
    ? "Action required: Bill payment reminders."
    : "Upcoming bill reminders for this month.";

  return (
    <EmailLayout
      previewText={`${titleText} — ${totalBills} bills totaling ${totalAmount}`}
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
        Total amount scheduled across {totalBills} bills:
      </Text>

      {/* Big Stat Callout (Like Wise '1 EUR = 112.004 INR') */}
      <div
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: hasUrgent ? "#DC2626" : "#0E1318",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {totalAmount}
      </div>

      {/* Vibrant Watercolor Alert Banner with Bell Badge */}
      <EmailHeroBanner type="alert" alt="Bill payment alerts" />

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
        {hasUrgent ? (
          <>
            You have{" "}
            <strong style={{ color: "#DC2626" }}>
              {dueTodayCount} due today and {overdueCount} overdue bills
            </strong>
            . Please verify sufficient balance in your linked payment accounts to prevent late fees.
          </>
        ) : (
          <>
            You have {upcomingCount} upcoming bills scheduled for the next 30 days. All accounts are
            in good standing.
          </>
        )}
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/bills`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Review and pay bills
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/calendar`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Open billing calendar
          </EmailButton>
        </div>
      </Section>

      {/* Individual Bill Cards with Circular Colored Icons */}
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
        Bill breakdown ({bills.length})
      </Heading>

      {bills.map((bill, index) => {
        let badgeText = `Due ${bill.dueDate}`;
        let badgeBg = "#F3F4F6";
        let badgeColor = "#374151";

        if (bill.status === "due_today") {
          badgeText = "Due Today";
          badgeBg = "#FEE2E2";
          badgeColor = "#991B1B";
        } else if (bill.status === "overdue") {
          badgeText = "Overdue";
          badgeBg = "#FEE2E2";
          badgeColor = "#DC2626";
        } else if (bill.status === "paid") {
          badgeText = "Paid";
          badgeBg = "#DCFCE7";
          badgeColor = "#166534";
        }

        return (
          <EmailFeatureCard
            key={index}
            icon="bill"
            title={bill.title}
            badge={badgeText}
            badgeBg={badgeBg}
            badgeColor={badgeColor}
            description={
              <>
                <strong style={{ color: "#0E1318", marginRight: "8px", fontSize: "14px" }}>
                  {bill.amount}
                </strong>
                {bill.account && <span>{bill.account}</span>}
                {bill.category && <span style={{ color: "#6B7280" }}> · {bill.category}</span>}
              </>
            }
          />
        );
      })}

      {/* Repeated Bottom Action Button */}
      <Section className="mt-6 mb-2 text-center">
        <EmailButton
          href={`${emailConfig.baseUrl}/dashboard/bills`}
          variant="pill"
          size="md"
          fullWidth={true}
        >
          Manage all bills
        </EmailButton>
      </Section>

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How do I mark a bill as paid or set up auto-debit?",
            href: `${emailConfig.baseUrl}/faq#marking-bills`,
          },
          {
            question: "Can I receive WhatsApp or SMS notifications for urgent bills?",
            href: `${emailConfig.baseUrl}/dashboard/settings#notifications`,
          },
          {
            question: "How do I add a new recurring utility or credit card bill?",
            href: `${emailConfig.baseUrl}/faq#adding-bills`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const BillsEmailPreview = () => (
  <BillsEmail
    bills={[
      {
        title: "Broadband & Internet (Airtel Xstream)",
        amount: "₹1,499",
        dueDate: "Today",
        status: "due_today",
        account: "ICICI Bank · *4021",
        category: "Utilities",
      },
      {
        title: "Credit Card Statement (HDFC Regalia)",
        amount: "₹34,820",
        dueDate: "In 3 days",
        status: "upcoming",
        account: "Auto-debit active",
        category: "Credit Cards",
      },
      {
        title: "Electricity Board Bill (BESCOM)",
        amount: "₹3,420",
        dueDate: "In 6 days",
        status: "upcoming",
        account: "SBI Savings",
        category: "Utilities",
      },
    ]}
    totalAmount="₹39,739"
    dueTodayCount={1}
    overdueCount={0}
    upcomingCount={2}
  />
);

export default BillsEmail;
