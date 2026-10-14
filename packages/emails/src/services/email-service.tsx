import "server-only";

import { Resend } from "resend";
import { env } from "@portfolio/env/server";
import { renderEmail } from "../utils/render-email";
import { NotificationEmail } from "../templates/NotificationEmail";
import { TestEmail } from "../templates/TestEmail";
import { WelcomeEmail } from "../templates/WelcomeEmail";
import { ActivationEmail } from "../templates/ActivationEmail";
import { BillsEmail } from "../templates/BillsEmail";
import { ContractsEmail } from "../templates/ContractsEmail";
import { DepositsEmail } from "../templates/DepositsEmail";
import { InvestmentsEmail } from "../templates/InvestmentsEmail";
import { emailConfig } from "../config";

// Type for event items in notification emails
interface EventItem {
  date: string;
  title: string;
  category: string;
  href?: string;
  amount?: string;
  description?: string;
}

// Type for bill items
interface BillItem {
  title: string;
  amount: string;
  dueDate: string;
  status: "due_today" | "overdue" | "upcoming" | "paid";
  account?: string;
  category?: string;
  href?: string;
}

// Type for contract items
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

// Type for deposit items
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

// Type for investment items
interface InvestmentItem {
  title: string;
  symbol: string;
  type: "Stock" | "Mutual Fund" | "ETF" | "Bond" | "Crypto" | "Real Estate";
  currentValue: string;
  changeAmount: string;
  changePercent: string;
  targetPrice?: string;
  status: "gaining" | "losing" | "stable" | "target_reached" | "alert";
  href?: string;
  news?: string;
}

/**
 * Send an email using React Email templates
 * This replaces the existing sendEmail function with rich HTML template support
 */
export async function sendTemplatedEmail(
  to: string,
  subject: string,
  template: React.ReactElement,
  idempotencyKey?: string,
) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  // Normalize email from address (same as existing sendEmail function)
  const from = env.EMAIL_FROM.normalize("NFKC")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();

  // Render the React Email template to HTML and text
  const { html, text } = await renderEmail(template);

  // Initialize Resend client
  const resend = new Resend(env.RESEND_API_KEY);

  // Send the email with both HTML and text parts
  const { error } = await resend.emails.send(
    {
      from,
      to: [to],
      subject,
      html,
      text,
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) {
    console.error("Resend rejected email delivery", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
    throw new Error(`Resend rejected email: ${error.message}`);
  }

  return { sent: true };
}

/**
 * Send a notification email with financial events
 * This replaces the existing plain text email in sendScheduledReminders
 */
export async function sendNotificationEmail(
  to: string,
  events: EventItem[],
  totalCount: number,
  daysAhead: number,
  title?: string,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(
    to,
    title || `Financial Reminders - ${totalCount} events in the next ${daysAhead} days`,
    <NotificationEmail
      events={events}
      totalCount={totalCount}
      daysAhead={daysAhead}
      title={title}
    />,
    idempotencyKey,
  );
}

/**
 * Send a test email using the React Email template
 * This replaces the existing sendTestEmail function
 */
export async function sendTestTemplatedEmail(
  to: string,
  userName?: string,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(
    to,
    `Selvam email notifications are ready`,
    <TestEmail email={to} userName={userName} />,
    idempotencyKey,
  );
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(to: string, userName: string, idempotencyKey?: string) {
  return sendTemplatedEmail(
    to,
    `Welcome to ${emailConfig.appName}!`,
    <WelcomeEmail userName={userName} email={to} />,
    idempotencyKey,
  );
}

/**
 * Send an activation / email confirmation link
 */
export async function sendActivationEmail(
  to: string,
  url: string,
  companyName?: string,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(
    to,
    "Confirm your email address",
    <ActivationEmail url={url} companyName={companyName} />,
    idempotencyKey,
  );
}

export const sendConfirmEmail = sendActivationEmail;

/**
 * Send a bills reminder email
 */
export async function sendBillsEmail(
  to: string,
  bills: BillItem[],
  totalAmount: string,
  dueTodayCount: number,
  overdueCount: number,
  upcomingCount: number,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(
    to,
    `Bill Payment Reminders - ${bills.length} bills need attention`,
    <BillsEmail
      bills={bills}
      totalAmount={totalAmount}
      dueTodayCount={dueTodayCount}
      overdueCount={overdueCount}
      upcomingCount={upcomingCount}
    />,
    idempotencyKey,
  );
}

/**
 * Send a contracts renewal email
 */
export async function sendContractsEmail(
  to: string,
  contracts: ContractItem[],
  totalContracts: number,
  expiringSoonCount: number,
  expiringTodayCount: number,
  expiredCount: number,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(
    to,
    `Contract Renewal Alerts - ${totalContracts} contracts need attention`,
    <ContractsEmail
      contracts={contracts}
      totalContracts={totalContracts}
      expiringSoonCount={expiringSoonCount}
      expiringTodayCount={expiringTodayCount}
      expiredCount={expiredCount}
    />,
    idempotencyKey,
  );
}

/**
 * Send a deposits maturity email
 */
export async function sendDepositsEmail(
  to: string,
  deposits: DepositItem[],
  totalDeposits: number,
  maturingTodayCount: number,
  maturedCount: number,
  maturingSoonCount: number,
  totalMaturityAmount: string,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(
    to,
    `Deposit Maturity Alerts - ${totalDeposits} deposits`,
    <DepositsEmail
      deposits={deposits}
      totalDeposits={totalDeposits}
      maturingTodayCount={maturingTodayCount}
      maturedCount={maturedCount}
      maturingSoonCount={maturingSoonCount}
      totalMaturityAmount={totalMaturityAmount}
    />,
    idempotencyKey,
  );
}

/**
 * Send an investments update email
 */
export async function sendInvestmentsEmail(
  to: string,
  investments: InvestmentItem[],
  totalPortfolioValue: string,
  dailyChange: string,
  dailyChangePercent: string,
  gainingCount: number,
  losingCount: number,
  alertsCount: number,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(
    to,
    `Investment Portfolio Update - ${totalPortfolioValue}`,
    <InvestmentsEmail
      investments={investments}
      totalPortfolioValue={totalPortfolioValue}
      dailyChange={dailyChange}
      dailyChangePercent={dailyChangePercent}
      gainingCount={gainingCount}
      losingCount={losingCount}
      alertsCount={alertsCount}
    />,
    idempotencyKey,
  );
}

/**
 * Utility function that acts as a drop-in replacement for the existing sendEmail
 * but with React Email template support
 */
export async function sendEmail(
  to: string,
  subject: string,
  reactElement: React.ReactElement,
  idempotencyKey?: string,
) {
  return sendTemplatedEmail(to, subject, reactElement, idempotencyKey);
}

/**
 * Legacy wrapper for existing plain text emails
 * This allows gradual migration from plain text to React Email templates
 */
export async function sendLegacyTextEmail(
  to: string,
  subject: string,
  textBody: string,
  idempotencyKey?: string,
) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const from = env.EMAIL_FROM.normalize("NFKC")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();

  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    { from, to: [to], subject, text: textBody },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) {
    console.error("Resend rejected email delivery", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
    });
    throw new Error(`Resend rejected email: ${error.message}`);
  }

  return { sent: true };
}

export default {
  sendTemplatedEmail,
  sendNotificationEmail,
  sendTestTemplatedEmail,
  sendWelcomeEmail,
  sendActivationEmail,
  sendConfirmEmail,
  sendBillsEmail,
  sendContractsEmail,
  sendDepositsEmail,
  sendInvestmentsEmail,
  sendEmail,
  sendLegacyTextEmail,
};
