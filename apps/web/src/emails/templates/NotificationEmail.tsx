import { Section, Column, Row, Link } from "@react-email/components";
import { EmailLayout } from "../components/EmailLayout";
import { EmailHeading, EmailSubheading, EmailBody, EmailCaption } from "../components/EmailText";
import { EmailButton } from "../components/EmailButton";
import { EmailCard } from "../components/EmailCard";
import { emailConfig, categoryIcons, categoryColors } from "../config";

interface EventItem {
  date: string;
  title: string;
  category: string;
  href?: string;
  amount?: string;
  description?: string;
}

interface NotificationEmailProps {
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
  const dueToday = events.filter((event) => event.date === new Date().toISOString().slice(0, 10));
  const defaultTitle = dueToday.length
    ? `${dueToday.length} financial ${dueToday.length === 1 ? "reminder" : "reminders"} today`
    : `${totalCount} upcoming financial ${totalCount === 1 ? "event" : "events"} in the next ${daysAhead} days`;

  return (
    <EmailLayout previewText={title || defaultTitle} title={title || defaultTitle}>
      {/* Main Heading */}
      <Section style={{ marginBottom: "24px" }}>
        <EmailHeading>{title || defaultTitle}</EmailHeading>
        <EmailBody color="#64748b" marginTop="8px">
          {dueToday.length ? (
            <>
              You have <strong>{dueToday.length}</strong> financial{" "}
              {dueToday.length === 1 ? "reminder" : "reminders"} due today.
            </>
          ) : (
            <>
              You have <strong>{totalCount}</strong> upcoming financial{" "}
              {totalCount === 1 ? "event" : "events"} in the next <strong>{daysAhead}</strong> days.
            </>
          )}
        </EmailBody>
      </Section>

      {/* Events List */}
      <Section style={{ marginBottom: "32px" }}>
        {events.slice(0, 6).map((event, index) => (
          <EventItemComponent
            key={`${event.date}-${event.title}-${index}`}
            event={event}
            isLast={index === events.slice(0, 6).length - 1}
          />
        ))}

        {totalCount > 6 && (
          <EmailCaption marginTop="16px">+{totalCount - 6} more events not shown</EmailCaption>
        )}
      </Section>

      {/* Call to Action */}
      <Section style={{ textAlign: "center", margin: "32px 0" }}>
        <EmailButton href={`${emailConfig.baseUrl}/dashboard/calendar`} fullWidth={false}>
          View Full Calendar
        </EmailButton>

        <EmailCaption marginTop="12px">
          <Link href={`${emailConfig.baseUrl}/dashboard/calendar`} style={{ color: "#0ea5e9" }}>
            {emailConfig.baseUrl}/dashboard/calendar
          </Link>
        </EmailCaption>
      </Section>

      {/* Summary */}
      {totalCount > 0 && (
        <EmailCard padding="md">
          <EmailSubheading marginBottom="16px">Summary</EmailSubheading>
          <Row style={{ gap: "16px", marginBottom: "16px" }}>
            <Column style={{ textAlign: "center" }}>
              <div
                style={{
                  backgroundColor: "#e0f2fe",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "8px",
                }}
              >
                <EmailHeading variant="h3" color="#0ea5e9" marginBottom="0">
                  {totalCount}
                </EmailHeading>
                <EmailCaption marginBottom="0">Total Events</EmailCaption>
              </div>
            </Column>
            <Column style={{ textAlign: "center" }}>
              <div
                style={{
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "8px",
                }}
              >
                <EmailHeading variant="h3" color="#f59e0b" marginBottom="0">
                  {dueToday.length}
                </EmailHeading>
                <EmailCaption marginBottom="0">Due Today</EmailCaption>
              </div>
            </Column>
            <Column style={{ textAlign: "center" }}>
              <div
                style={{
                  backgroundColor: "#d1fae5",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "8px",
                }}
              >
                <EmailHeading variant="h3" color="#22c55e" marginBottom="0">
                  {daysAhead}
                </EmailHeading>
                <EmailCaption marginBottom="0">Days Ahead</EmailCaption>
              </div>
            </Column>
          </Row>
        </EmailCard>
      )}

      {/* Help Text */}
      <Section style={{ textAlign: "center", marginTop: "32px" }}>
        <EmailCaption color="#64748b">
          Manage your notification preferences in your
          <Link href={`${emailConfig.baseUrl}/dashboard/settings`} style={{ color: "#0ea5e9" }}>
            account settings
          </Link>
        </EmailCaption>
      </Section>
    </EmailLayout>
  );
}

function EventItemComponent({ event, isLast }: { event: EventItem; isLast: boolean }) {
  const icon = categoryIcons[event.category] || "📋";
  const color = categoryColors[event.category] || "#64748b";
  const isDueToday = event.date === new Date().toISOString().slice(0, 10);

  return (
    <EmailCard
      padding="md"
      border={true}
      backgroundColor="#f8fafc"
      style={{ marginBottom: isLast ? "0" : "16px" }}
    >
      <Row style={{ gap: "16px", alignItems: "flex-start" }}>
        {/* Icon */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            backgroundColor: isDueToday ? "#ef4444" : color + "20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            flexShrink: 0,
          }}
        >
          <span>{icon}</span>
        </div>

        {/* Content */}
        <Column style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <EmailBody weight="bold" marginBottom="0">
              {event.title}
            </EmailBody>
            {isDueToday && (
              <span
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                TODAY
              </span>
            )}
          </div>

          <EmailCaption marginBottom="4px" color="#64748b">
            {event.category}
          </EmailCaption>

          <EmailCaption marginBottom="8px">{event.date}</EmailCaption>

          {event.amount && (
            <EmailBody marginBottom="0" color="#0f172a">
              Amount: {event.amount}
            </EmailBody>
          )}

          {event.description && (
            <EmailBody marginBottom="0" color="#475569" marginTop="8px">
              {event.description}
            </EmailBody>
          )}

          {event.href && (
            <EmailCaption marginTop="8px">
              <Link href={event.href} style={{ color: "#0ea5e9", textDecoration: "none" }}>
                View details →
              </Link>
            </EmailCaption>
          )}
        </Column>
      </Row>
    </EmailCard>
  );
}

// Preview component for development
export function NotificationEmailPreview() {
  const sampleEvents: EventItem[] = [
    {
      date: new Date().toISOString().slice(0, 10),
      title: "Electricity Bill Payment",
      category: "Bills",
      href: "#",
      amount: "€120.50",
    },
    {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      title: "Internet Bill Due",
      category: "Bills",
      href: "#",
      amount: "€45.00",
    },
    {
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      title: "Rent Payment",
      category: "Bills",
      href: "#",
      amount: "€1,200.00",
    },
    {
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      title: "Phone Contract Renewal",
      category: "Contracts",
      href: "#",
    },
    {
      date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      title: "Fixed Deposit Maturity",
      category: "Deposits",
      href: "#",
      amount: "€5,000.00",
    },
  ];

  return <NotificationEmail events={sampleEvents} totalCount={5} daysAhead={7} />;
}

export default NotificationEmail;
