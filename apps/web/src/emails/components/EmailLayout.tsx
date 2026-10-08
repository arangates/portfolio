import { Html, Head, Font, Preview, Body, Container, Section, Text } from "@react-email/components";
import { emailConfig } from "../config";

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
  title?: string;
}

export function EmailLayout({ children, previewText, title }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          fontStyle="normal"
          fontWeight={400}
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          fontStyle="normal"
          fontWeight={600}
        />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>{title || `${emailConfig.appName} Notification`}</title>
      </Head>
      <Preview>{previewText || `Notification from ${emailConfig.appName}`}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: "#f8fafc" }}>
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "40px 20px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            fontFamily: "Inter, Helvetica, Arial, sans-serif",
            color: "#0f172a",
            lineHeight: "1.5",
          }}
        >
          {/* Header */}
          <EmailHeader />

          {/* Main Content */}
          <Section style={{ padding: "32px 0" }}>{children}</Section>

          {/* Footer */}
          <EmailFooter />
        </Container>

        {/* Dark mode support notice */}
        <Text
          style={{
            fontSize: "12px",
            color: "#64748b",
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          This email supports dark mode. View in a dark mode compatible email client.
        </Text>
      </Body>
    </Html>
  );
}

function EmailHeader() {
  return (
    <Section
      style={{
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "24px",
        marginBottom: "24px",
      }}
    >
      <Container
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: "48px",
            height: "48px",
            background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "20px",
          }}
        >
          S
        </div>

        <div>
          <Text
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#0f172a",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            {emailConfig.appName}
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#64748b",
              margin: "4px 0 0 0",
            }}
          >
            Financial Portfolio Management
          </Text>
        </div>
      </Container>
    </Section>
  );
}

function EmailFooter() {
  return (
    <Section
      style={{
        borderTop: "1px solid #e2e8f0",
        paddingTop: "24px",
        marginTop: "32px",
      }}
    >
      <Text
        style={{
          fontSize: "14px",
          color: "#64748b",
          margin: "0 0 16px 0",
        }}
      >
        This is an automated message, please do not reply directly to this email.
      </Text>

      <Text
        style={{
          fontSize: "14px",
          color: "#64748b",
          margin: "0 0 16px 0",
        }}
      >
        For support, contact us at {emailConfig.supportEmail}
      </Text>

      <Text
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          margin: "0",
        }}
      >
        © {new Date().getFullYear()} {emailConfig.appName}. All rights reserved.
      </Text>

      <Text
        style={{
          fontSize: "12px",
          color: "#94a3b8",
          margin: "8px 0 0 0",
        }}
      >
        <a
          href={`${emailConfig.baseUrl}/dashboard`}
          style={{
            color: "#64748b",
            textDecoration: "none",
          }}
        >
          View in browser
        </a>
        ·
        <a
          href={`${emailConfig.baseUrl}/dashboard/settings`}
          style={{
            color: "#64748b",
            textDecoration: "none",
          }}
        >
          Notification preferences
        </a>
      </Text>
    </Section>
  );
}

export default EmailLayout;
