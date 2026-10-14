// Email templates
export { ActivationEmail, ActivationEmailPreview, ConfirmEmail } from "./templates/ActivationEmail";

export { NotificationEmail, NotificationEmailPreview } from "./templates/NotificationEmail";

export { TestEmail, TestEmailPreview } from "./templates/TestEmail";

export { WelcomeEmail, WelcomeEmailPreview } from "./templates/WelcomeEmail";

export { BillsEmail, BillsEmailPreview } from "./templates/BillsEmail";

export { ContractsEmail, ContractsEmailPreview } from "./templates/ContractsEmail";

export { DepositsEmail, DepositsEmailPreview } from "./templates/DepositsEmail";

export { InvestmentsEmail, InvestmentsEmailPreview } from "./templates/InvestmentsEmail";

// Email components
export { EmailLayout } from "./components/EmailLayout";

export { EmailLogo } from "./components/EmailLogo";

export { EmailHeroBanner } from "./components/EmailHeroBanner";

export { EmailFeatureCard } from "./components/EmailFeatureCard";

export { EmailFaqCard } from "./components/EmailFaqCard";

export { EmailButton } from "./components/EmailButton";

export { EmailCard, EmailGrid } from "./components/EmailCard";

export {
  EmailText,
  EmailHeading,
  EmailSubheading,
  EmailBody,
  EmailCaption,
} from "./components/EmailText";

export { EmailDivider } from "./components/EmailDivider";

// Theme & Fonts
export { barebonesBoxedTailwindConfig, barebonesTailwindConfig, colors, fontScale } from "./theme";

export { BarebonesFonts } from "./theme-fonts";

// Email utilities
export { renderEmailToHTML, renderEmailToText, renderEmail } from "./utils/render-email";

// Email configuration
export {
  emailConfig,
  tailwindConfig,
  categoryIcons,
  categoryColors,
  emailTemplateCategories,
} from "./config";

// Email services
export {
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
} from "./services/email-service";
