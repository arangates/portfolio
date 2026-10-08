# React Email Templates for Selvam

This directory contains all React Email templates for the Selvam application. React Email allows us to create beautiful, responsive email templates using React components that are automatically converted to HTML and CSS compatible with email clients.

## Installation

The following dependencies have been added to the web application:

```bash
pnpm add @react-email/components @react-email/render @react-email/tailwind
```

## Project Structure

```
emails/
├── components/          # Reusable email components
│   ├── EmailButton.tsx
│   ├── EmailCard.tsx
│   ├── EmailDivider.tsx
│   ├── EmailLayout.tsx  # Main email layout wrapper
│   └── EmailText.tsx
├── config.ts           # Configuration and constants
├── index.ts            # Main exports
├── preview/             # Email preview pages
│   └── [[...slug]].tsx
├── services/           # Email sending services
│   └── email-service.ts
├── templates/          # Email templates
│   ├── BillsEmail.tsx
│   ├── ContractsEmail.tsx
│   ├── DepositsEmail.tsx
│   ├── NotificationEmail.tsx
│   ├── TestEmail.tsx
│   └── WelcomeEmail.tsx
└── utils/              # Utilities
    └── render-email.tsx
```

## Email Templates

### Available Templates

1. **NotificationEmail** - Main notification template for financial reminders
2. **TestEmail** - Test email template to verify email configuration
3. **WelcomeEmail** - Onboarding email for new users
4. **BillsEmail** - Dedicated template for bill payment reminders
5. **ContractsEmail** - Template for contract renewal alerts
6. **DepositsEmail** - Template for deposit maturity notifications

### Template Features

- **Responsive Design**: All templates are responsive and work on mobile and desktop
- **Dark Mode Support**: Templates support dark mode in compatible email clients
- **Branded Layout**: Consistent header, footer, and styling matching Selvam's brand
- **Interactive Elements**: Buttons and links that work across email clients
- **Accessibility**: Proper contrast, font sizes, and semantic HTML

## Usage

### Sending Emails

Import the email service functions and use them to send templated emails:

```typescript
import {
  sendTestTemplatedEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
  sendBillsEmail,
  sendContractsEmail,
  sendDepositsEmail
} from "@/emails/services/email-service";

// Send a test email
await sendTestTemplatedEmail("user@example.com", "User Name", "test-email-123");

// Send a welcome email
await sendWelcomeEmail("user@example.com", "John Doe", "welcome-123");

// Send notification email with events
await sendNotificationEmail(
  "user@example.com",
  events, // Array of event items
  totalCount,
  daysAhead,
  "Custom Title",
  "idempotency-key-123"
);
```

### Creating Custom Templates

1. Create a new file in `src/emails/templates/`
2. Import and use the base components
3. Wrap your template in the `EmailLayout` component
4. Export both the component and a preview component

```typescript
import { EmailLayout } from "../components/EmailLayout";
import { EmailText, EmailHeading } from "../components/EmailText";

export function MyCustomEmail({ name }: { name: string }) {
  return (
    <EmailLayout previewText={`Custom email for ${name}`}>
      <EmailHeading>Hello, {name}!</EmailHeading>
      <EmailText>This is a custom email template.</EmailText>
    </EmailLayout>
  );
}

export function MyCustomEmailPreview() {
  return <MyCustomEmail name="Test User" />;
}
```

### Adding to Services

Add your template to the email service:

```typescript
// In email-service.ts
import { MyCustomEmail } from "../templates/MyCustomEmail";

export async function sendCustomEmail(to: string, name: string, idempotencyKey?: string) {
  return sendTemplatedEmail(
    to,
    `Custom Email for ${name}`,
    <MyCustomEmail name={name} />,
    idempotencyKey
  );
}
```

## Preview System

### Local Development Preview

Access the email preview interface at:
```
http://localhost:3001/emails/preview
```

Or preview specific templates:
```
http://localhost:3001/emails/preview/notification
http://localhost:3001/emails/preview/test
http://localhost:3001/emails/preview/welcome
http://localhost:3001/emails/preview/bills
http://localhost:3001/emails/preview/contracts
http://localhost:3001/emails/preview/deposits
```

### API Preview

Get HTML preview via API:
```bash
curl http://localhost:3001/api/emails/preview/notification
```

## Configuration

Email configuration is in `src/emails/config.ts`:

```typescript
export const emailConfig = {
  from: process.env.EMAIL_FROM || "Selvam <notifications@selvam.app>",
  baseUrl: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  appName: "Selvam",
  supportEmail: "support@selvam.app",
};
```

## Environment Variables

Required for email sending:
- `RESEND_API_KEY` - API key from Resend
- `EMAIL_FROM` - Sender email address

These are already configured in your `.env` file.

## Migration from Plain Text Emails

The existing `sendEmail` function in `push-notifications.ts` has been updated to use the new React Email services while maintaining backward compatibility.

### Before (Plain Text)
```typescript
async function sendEmail(to: string, subject: string, textBody: string) {
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [to],
    subject,
    text: textBody
  });
}
```

### After (React Email Templates)
```typescript
import { sendTemplatedEmail } from "@/emails/services/email-service";

async function sendEmail(to: string, subject: string, reactElement: React.ReactElement) {
  return sendTemplatedEmail(to, subject, reactElement);
}
```

## Email Design Guidelines

### Colors
- **Primary**: `#0ea5e9` (Sky Blue)
- **Success**: `#22c55e` (Green)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Background**: `#ffffff` (White)
- **Surface**: `#f8fafc` (Light Gray)
- **Text Primary**: `#0f172a` (Dark)
- **Text Secondary**: `#64748b` (Medium Gray)

### Typography
- **Heading 1**: 32px, bold
- **Heading 2**: 24px, bold
- **Heading 3**: 20px, semibold
- **Body**: 16px, regular
- **Caption**: 14px, regular
- **Small**: 12px, regular

### Spacing
- Use multiples of 4px for consistent spacing
- Main content: 32px padding
- Sections: 24px margin
- Elements: 16px gap

## Testing Emails

### Test Email Function
```typescript
// This has been updated to use the new React Email template
await sendTestEmail(userId);
```

### Manual Testing
1. Start the development server
2. Visit `/emails/preview` to see all templates
3. Use the authenticated API endpoint `/api/emails/send` with `{ "type": "test" }` or `{ "type": "welcome" }`. It sends only to the signed-in user's verified account email; recipient addresses cannot be supplied.

## Troubleshooting

### Missing Dependencies
If you see import errors, ensure you've installed the required packages:
```bash
pnpm add @react-email/components @react-email/render @react-email/tailwind
```

### Email Not Sending
1. Verify `RESEND_API_KEY` and `EMAIL_FROM` are set in `.env`
2. Check that your Resend account is properly configured
3. Ensure your domain is verified in Resend

### Template Rendering Issues
1. Check for React syntax errors in your templates
2. Ensure all components are properly imported
3. Verify that you're using email-compatible components from `@react-email/components`

## API Reference

### Email Service Functions

#### `sendTemplatedEmail(to, subject, template, idempotencyKey?)`
Send any React Email template

#### `sendNotificationEmail(to, events, totalCount, daysAhead, title?, idempotencyKey?)`
Send financial notification email

#### `sendTestTemplatedEmail(to, userName?, idempotencyKey?)`
Send test email template

#### `sendWelcomeEmail(to, userName, idempotencyKey?)`
Send welcome/onboarding email

#### `sendBillsEmail(to, bills, totalAmount, dueTodayCount, overdueCount, upcomingCount, idempotencyKey?)`
Send bills reminder email

#### `sendContractsEmail(to, contracts, totalContracts, expiringSoonCount, expiringTodayCount, expiredCount, idempotencyKey?)`
Send contracts renewal email

#### `sendDepositsEmail(to, deposits, totalDeposits, maturingTodayCount, maturedCount, maturingSoonCount, totalMaturityAmount, idempotencyKey?)`
Send deposits maturity email

#### `sendLegacyTextEmail(to, subject, textBody, idempotencyKey?)`
Send plain text email (for backward compatibility)

## Resources

- [React Email Documentation](https://react.email/docs)
- [Resend Documentation](https://resend.com/docs)
- [Email Client Support](https://react.email/docs/email-clients)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Future Enhancements

- [ ] Add more dedicated templates for other notification categories (Tax, Salary, Investments, etc.)
- [ ] Add A/B testing for email templates
- [ ] Add email analytics and tracking
- [ ] Add email template versioning
- [ ] Add localization support for email templates
- [ ] Add dark mode testing tools
- [ ] Add accessibility validation for templates