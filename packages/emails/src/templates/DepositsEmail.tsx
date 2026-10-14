import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface DepositItem {
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

export interface DepositsEmailProps {
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
  const companyName = emailConfig.appName;
  const hasUrgent = maturingTodayCount > 0 || maturedCount > 0;
  const titleText = hasUrgent
    ? "Action required: Fixed deposit maturity alerts."
    : "Upcoming fixed deposit maturity alerts.";

  return (
    <EmailLayout
      previewText={`${titleText} — ${totalDeposits} deposits (${totalMaturityAmount})`}
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
        Total maturity payout across {totalDeposits} deposits:
      </Text>

      {/* Big Stat Callout (Like Wise '1 EUR = 112.004 INR') */}
      <div
        style={{
          fontSize: "28px",
          fontWeight: 800,
          color: "#15803D",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {totalMaturityAmount}
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="Fixed deposit maturity alerts" />

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
            You have <strong style={{ color: "#0E1318" }}>funds maturing today</strong> ready for
            reinvestment or withdrawal. Decide promptly to avoid defaulting into low-yield savings
            interest.
          </>
        ) : (
          <>
            You have {maturingSoonCount} fixed deposits scheduled to mature within the next 30 days.
            Plan your reinvestment strategy in advance.
          </>
        )}
      </Text>

      {/* Primary & Secondary Action Buttons (Wise Pill Style) */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/deposits`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Review deposit maturities
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            View consolidated net worth
          </EmailButton>
        </div>
      </Section>

      {/* Individual Deposit Cards with Circular Vault Icons */}
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
        Tracked deposits ({deposits.length})
      </Heading>

      {deposits.map((deposit, index) => {
        let badgeText = deposit.interestRate ? `${deposit.interestRate} p.a.` : "Active";
        let badgeBg = "#DCFCE7";
        let badgeColor = "#166534";

        if (deposit.status === "maturing_today") {
          badgeText = "Matures Today";
          badgeBg = "#FEE2E2";
          badgeColor = "#991B1B";
        } else if (deposit.status === "maturing_soon") {
          badgeText = `In ${deposit.daysUntilMaturity} days`;
          badgeBg = "#FEF3C7";
          badgeColor = "#92400E";
        }

        return (
          <EmailFeatureCard
            key={index}
            icon="vault"
            title={deposit.title}
            badge={badgeText}
            badgeBg={badgeBg}
            badgeColor={badgeColor}
            description={
              <>
                <strong style={{ color: "#0E1318", marginRight: "6px" }}>
                  {deposit.maturityAmount || deposit.amount}
                </strong>
                <span>{deposit.bank}</span>
                {deposit.accountNumber && (
                  <span style={{ color: "#6B7280" }}> · Acc: {deposit.accountNumber}</span>
                )}
                <span style={{ color: "#6B7280" }}> — Matures {deposit.maturityDate}</span>
              </>
            }
          />
        );
      })}

      {/* Repeated Bottom Action Button */}
      <Section className="mt-6 mb-2 text-center">
        <EmailButton
          href={`${emailConfig.baseUrl}/dashboard/deposits`}
          variant="pill"
          size="md"
          fullWidth={true}
        >
          Manage fixed deposits
        </EmailButton>
      </Section>

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How do I choose between auto-renewal and bank transfer?",
            href: `${emailConfig.baseUrl}/faq#deposit-renewal-options`,
          },
          {
            question: "How is TDS on fixed deposit interest calculated?",
            href: `${emailConfig.baseUrl}/faq#deposit-tds-tax`,
          },
          {
            question: "Can I track cumulative vs non-cumulative deposits?",
            href: `${emailConfig.baseUrl}/faq#deposit-types`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const DepositsEmailPreview = () => (
  <DepositsEmail
    deposits={[
      {
        title: "SBI Multi-Option Special Deposit",
        bank: "State Bank of India",
        maturityDate: "2026-10-24",
        daysUntilMaturity: 10,
        amount: "₹5,00,000",
        interestRate: "7.1%",
        maturityAmount: "₹5,36,450",
        status: "maturing_soon",
        accountNumber: "SBI · *8912",
      },
      {
        title: "HDFC Senior Citizen Advantage FD",
        bank: "HDFC Bank",
        maturityDate: "2026-11-12",
        daysUntilMaturity: 29,
        amount: "₹10,00,000",
        interestRate: "7.75%",
        maturityAmount: "₹10,80,240",
        status: "active",
        accountNumber: "HDFC · *1402",
      },
    ]}
    totalDeposits={2}
    maturingTodayCount={0}
    maturedCount={0}
    maturingSoonCount={1}
    totalMaturityAmount="₹16,16,690"
  />
);

export default DepositsEmail;
