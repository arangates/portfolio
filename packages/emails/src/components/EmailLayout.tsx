import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type React from "react";
import { emailConfig } from "../config";
import { barebonesBoxedTailwindConfig } from "../theme";
import { BarebonesFonts } from "../theme-fonts";

import { EmailLogo } from "./EmailLogo";

interface EmailLayoutProps {
  children: React.ReactNode;
  previewText?: string;
  title?: string;
  companyName?: string;
  showWordmark?: boolean;
}

export function EmailLayout({
  children,
  previewText,
  title,
  companyName = emailConfig.appName,
  showWordmark = true,
}: EmailLayoutProps) {
  const displayTitle = title || `${companyName} Notification`;
  const displayPreview = previewText || `Notification from ${companyName}`;

  return (
    <Tailwind config={barebonesBoxedTailwindConfig}>
      <Html lang="en">
        <Head>
          <BarebonesFonts />
          <title>{displayTitle}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>

        <Body className="bg-[#FFFFFF] m-0 text-center font-sans antialiased">
          <Preview>{displayPreview}</Preview>
          <Container className="mobile:px-3 mx-auto mt-0 mb-10 w-full max-w-[580px] px-4">
            {/* Centered Brand Header (Wise Style) */}
            {showWordmark && (
              <Section className="pt-8 pb-5 text-center">
                <EmailLogo
                  variant="wordmark"
                  height={42}
                  width={186}
                  href={`${emailConfig.baseUrl}/dashboard`}
                />
              </Section>
            )}

            {/* Main Template Content */}
            {children}

            {/* Footer with Divider */}
            <Section className="mt-8 pt-6 pb-12 text-center">
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #E5E7EB",
                  margin: "24px 0",
                }}
              />
              <Text
                style={{
                  fontSize: "12.5px",
                  lineHeight: "1.6",
                  color: "#6B7280",
                  margin: "0 auto 12px",
                  maxWidth: "400px",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {companyName} is your intelligent financial portfolio and wealth management
                platform.
              </Text>

              <Text
                style={{
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "#9CA3AF",
                  margin: "0 0 10px",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                This automated notification was delivered to your registered account email.
              </Text>

              <Text
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  margin: 0,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                <Link
                  href={`${emailConfig.baseUrl}/dashboard`}
                  style={{
                    color: "#163300",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  Dashboard
                </Link>
                {" · "}
                <Link
                  href={`${emailConfig.baseUrl}/dashboard/settings`}
                  style={{
                    color: "#163300",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  Alert preferences
                </Link>
                {" · "}
                <Link
                  href={`mailto:${emailConfig.supportEmail}`}
                  style={{
                    color: "#163300",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  Help center
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}

export default EmailLayout;
