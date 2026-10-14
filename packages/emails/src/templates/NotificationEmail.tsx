import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface EventItem {
  date: string;
  title: string;
  category: string;
  href?: string;
  amount?: string;
  description?: string;
}

export interface NotificationEmailProps {
  events: EventItem[];
  totalCount: number;
  daysAhead: number;
  title?: string;
}

export function NotificationEmail({
  events,
  totalCount,
  daysAhead,
  title,
}: NotificationEmailProps) {
  const companyName = emailConfig.appName;
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueToday = events.filter((event) => event.date === todayStr);

  const defaultTitle = dueToday.length
    ? `${dueToday.length} financial ${dueToday.length === 1 ? "reminder" : "reminders"} due today.`
    : `${totalCount} upcoming financial ${totalCount === 1 ? "event" : "events"} scheduled.`;

  const headingText = title || defaultTitle;

  const getCategoryIcon = (
    category: string,
  ): "bill" | "contract" | "vault" | "chart" | "bank" | "bell" => {
    const c = category.toLowerCase();
    if (c.includes("bill")) return "bill";
    if (c.includes("contract")) return "contract";
    if (c.includes("deposit")) return "vault";
    if (c.includes("invest") || c.includes("stock") || c.includes("valuation")) return "chart";
    if (c.includes("bank") || c.includes("transaction")) return "bank";
    return "bell";
  };

  return (
    <EmailLayout
      previewText={`${headingText} — ${totalCount} events in the next ${daysAhead} days`}
      title={headingText}
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
        {headingText}
      </Heading>

      {/* Subtitle with Context & Timing */}
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
        Scheduled alert digest for the next {daysAhead} days:
      </Text>

      {/* Big Stat Callout (Like Wise '1 EUR = 112.004 INR') */}
      <div
        style={{
          fontSize: "22px",
          fontWeight: 800,
          color: "#0E1318",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {dueToday.length > 0 ? (
          <span style={{ color: "#DC2626" }}>
            {dueToday.length} Due Today · {totalCount} Total Events
          </span>
        ) : (
          <span>{totalCount} Total Upcoming Events</span>
        )}
      </div>

      {/* Vibrant Watercolor Alert Banner with Bell Badge */}
      <EmailHeroBanner type="alert" alt="Financial reminder alerts" />

      {/* Explanatory Body Copy */}
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
        Here is your curated breakdown of scheduled financial actions. Stay on top of bill payment
        deadlines, deposit maturity reinvestments, and contract renewals.
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/calendar`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Review all reminders
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/settings`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Manage notification preferences
          </EmailButton>
        </div>
      </Section>

      {/* Individual Reminder Cards with Circular Colored Icons */}
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
        Scheduled items ({events.length})
      </Heading>

      {events.map((event, index) => {
        const isUrgent = event.date === todayStr;
        const iconType = getCategoryIcon(event.category);

        return (
          <EmailFeatureCard
            key={index}
            icon={iconType}
            title={event.title}
            badge={isUrgent ? "Due Today" : event.date}
            badgeBg={isUrgent ? "#FEE2E2" : "#F3F4F6"}
            badgeColor={isUrgent ? "#991B1B" : "#374151"}
            description={
              <>
                {event.amount && (
                  <strong style={{ color: "#0E1318", marginRight: "6px" }}>{event.amount}</strong>
                )}
                <span style={{ color: "#6B7280" }}>{event.category}</span>
                {event.description && <span> — {event.description}</span>}
              </>
            }
          />
        );
      })}

      {/* Repeated Bottom Action Button */}
      <Section className="mt-6 mb-2 text-center">
        <EmailButton
          href={`${emailConfig.baseUrl}/dashboard`}
          variant="pill"
          size="md"
          fullWidth={true}
        >
          Open portfolio dashboard
        </EmailButton>
      </Section>

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "What automated email digests does Selvam deliver?",
            href: `${emailConfig.docsUrl}/faq#what-automated-email-digests-does-selvam-deliver`,
          },
          {
            question: "How do I customize alert frequency or delivery channels?",
            href: `${emailConfig.docsUrl}/faq#how-do-i-customize-alert-frequency-or-delivery-channels`,
          },
          {
            question: "How do I mark an alert as completed or paid?",
            href: `${emailConfig.docsUrl}/faq#general--account`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const NotificationEmailPreview = () => (
  <NotificationEmail
    events={[
      {
        date: new Date().toISOString().slice(0, 10),
        title: "Home Electricity & Utilities Bill",
        category: "Bills",
        amount: "₹4,250",
        description: "Auto-debit scheduled from HDFC Salary Account",
      },
      {
        date: "2026-10-20",
        title: "Health Insurance Annual Premium",
        category: "Contracts",
        amount: "₹18,500",
        description: "HDFC ERGO Optima Secure renewal notice",
      },
      {
        date: "2026-10-28",
        title: "SBI 1-Year Fixed Deposit Maturity",
        category: "Deposits",
        amount: "₹2,50,000",
        description: "Principal + 7.1% interest payout ready for reinvestment",
      },
      {
        date: "2026-11-01",
        title: "Monthly SIP Mutual Fund Investment",
        category: "Investments",
        amount: "₹25,000",
        description: "Parag Parikh Flexi Cap & Nifty 50 Index Fund",
      },
    ]}
    totalCount={4}
    daysAhead={14}
  />
);

export default NotificationEmail;
