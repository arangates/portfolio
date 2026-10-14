import { Heading, Section, Text } from "@react-email/components";
import { EmailButton } from "../components/EmailButton";
import { EmailFaqCard } from "../components/EmailFaqCard";
import { EmailFeatureCard } from "../components/EmailFeatureCard";
import { EmailHeroBanner } from "../components/EmailHeroBanner";
import { EmailLayout } from "../components/EmailLayout";
import { emailConfig } from "../config";

export interface FireMilestoneEmailProps {
  userName: string;
  milestoneName: string;
  milestonePercent: number;
  currentCorpus: string;
  targetCorpus: string;
  projectedFireAge: number;
  currentAge: number;
  monthlySavingsRate: string;
  safeWithdrawalAmount: string;
}

export function FireMilestoneEmail({
  userName,
  milestoneName,
  milestonePercent,
  currentCorpus,
  targetCorpus,
  projectedFireAge,
  currentAge,
  monthlySavingsRate,
  safeWithdrawalAmount,
}: FireMilestoneEmailProps) {
  const companyName = emailConfig.appName;

  return (
    <EmailLayout
      previewText={`Milestone Reached: You are now ${milestonePercent}% on the way to Financial Independence!`}
      title={`${milestoneName} Milestone Achieved — ${companyName}`}
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
        Congratulations {userName}, you hit {milestonePercent}% of your FIRE target!
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
        Financial Independence & Retirement Runway milestone:
      </Text>

      {/* Prominent Stat Callout */}
      <div
        style={{
          fontSize: "26px",
          fontWeight: 800,
          color: "#166534",
          textAlign: "center",
          margin: "0 0 20px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {currentCorpus} / {targetCorpus} ({milestonePercent}%)
      </div>

      {/* Vibrant Watercolor Wealth Banner */}
      <EmailHeroBanner type="wealth" alt="FIRE Milestone Achieved" />

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
        Crossing <strong style={{ color: "#0E1318" }}>{milestoneName}</strong> is a major financial
        victory. At your current savings rate of {monthlySavingsRate}, your investments compound to
        fully support your lifestyle by age {projectedFireAge} ({projectedFireAge - currentAge}{" "}
        years ahead).
      </Text>

      {/* Primary & Secondary Pill Action Buttons */}
      <Section className="my-6 text-center">
        <div style={{ marginBottom: "12px" }}>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/fire`}
            variant="pill"
            size="md"
            fullWidth={true}
          >
            Explore your FIRE runway
          </EmailButton>
        </div>
        <div>
          <EmailButton
            href={`${emailConfig.baseUrl}/dashboard/twin`}
            variant="pill-outline"
            size="md"
            fullWidth={true}
          >
            Simulate retirement scenarios
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
        Retirement metrics breakdown
      </Heading>

      <EmailFeatureCard
        icon="chart"
        title="Projected Retirement Age"
        badge={`Age ${projectedFireAge}`}
        badgeBg="#DCFCE7"
        badgeColor="#166534"
        description={
          <>
            Based on historical equity returns and inflation-adjusted living expenses, you are on
            track to reach full financial independence at{" "}
            <strong style={{ color: "#0E1318" }}>age {projectedFireAge}</strong>.
          </>
        }
      />

      <EmailFeatureCard
        icon="bank"
        title="Safe Monthly Passive Income"
        badge={safeWithdrawalAmount}
        badgeBg="#DBEAFE"
        badgeColor="#1E40AF"
        description={
          <>
            Under a 3.5% Safe Withdrawal Rate (SWR), your current accumulated corpus already
            generates <strong style={{ color: "#0E1318" }}>{safeWithdrawalAmount} per month</strong>{" "}
            in perpetual passive cash flow.
          </>
        }
      />

      <EmailFeatureCard
        icon="vault"
        title="Savings Rate Velocity"
        badge={`${monthlySavingsRate} Rate`}
        badgeBg="#FEF3C7"
        badgeColor="#92400E"
        description={
          <>
            Consistently deploying{" "}
            <strong style={{ color: "#0E1318" }}>{monthlySavingsRate}</strong> of your net monthly
            cash flow has accelerated your retirement date by 2.4 years.
          </>
        }
      />

      {/* FAQ Section */}
      <EmailFaqCard
        questions={[
          {
            question: "How does the FIRE Engine calculate safe withdrawal rates?",
            href: `${emailConfig.docsUrl}/faq#how-are-portfolio-returns-and-xirr-calculated`,
          },
          {
            question: "What is the difference between LeanFIRE and CoastFIRE?",
            href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
          },
          {
            question: "How can I simulate early mortgage prepayment impact?",
            href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
          },
        ]}
      />
    </EmailLayout>
  );
}

export const FireMilestoneEmailPreview = () => (
  <FireMilestoneEmail
    userName="Priya"
    milestoneName="CoastFIRE"
    milestonePercent={50}
    currentCorpus="₹1,25,00,000"
    targetCorpus="₹2,50,00,000"
    projectedFireAge={43}
    currentAge={34}
    monthlySavingsRate="52%"
    safeWithdrawalAmount="₹36,450"
  />
);

export default FireMilestoneEmail;
