import { Link, Section, Text } from "@react-email/components";
import type React from "react";
import { emailConfig } from "../config";

export interface FaqItem {
  question: string;
  href?: string;
}

export interface EmailFaqCardProps {
  title?: string;
  questions?: FaqItem[];
  docsUrl?: string;
  style?: React.CSSProperties;
  className?: string;
}

const defaultFaqQuestions: FaqItem[] = [
  {
    question: "How do I link bank and investment accounts?",
    href: `${emailConfig.docsUrl}/faq#which-financial-assets-can-i-track-in-selvam`,
  },
  {
    question: "How does Selvam protect my financial data?",
    href: `${emailConfig.docsUrl}/faq#how-does-selvam-protect-my-financial-data`,
  },
  {
    question: "How do I customize reminder frequency?",
    href: `${emailConfig.docsUrl}/faq#how-do-i-customize-alert-frequency-or-delivery-channels`,
  },
];

export function EmailFaqCard({
  title = "Your questions, answered",
  questions = defaultFaqQuestions,
  docsUrl = emailConfig.docsUrl,
  style,
  className = "",
}: EmailFaqCardProps) {
  return (
    <Section
      className={`bg-[#F2F4F2] rounded-[16px] px-6 py-7 text-center my-6 ${className}`}
      style={{
        backgroundColor: "#F2F4F2",
        borderRadius: "16px",
        padding: "24px 20px",
        margin: "24px 0",
        textAlign: "center",
        ...style,
      }}
    >
      <Text
        style={{
          fontSize: "17px",
          fontWeight: 800,
          color: "#0E1318",
          margin: "0 0 14px 0",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {title}
      </Text>
      {questions.map((item, idx) => {
        const targetUrl = item.href || `${docsUrl}/faq`;
        return (
          <div key={idx} style={{ marginBottom: "10px" }}>
            <Link
              href={targetUrl}
              style={{
                color: "#163300",
                textDecoration: "underline",
                fontWeight: 700,
                fontSize: "14px",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {item.question}
            </Link>
          </div>
        );
      })}

      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #E2E5E2" }}>
        <Link
          href={docsUrl}
          style={{
            color: "#4B5563",
            textDecoration: "none",
            fontSize: "12.5px",
            fontWeight: 600,
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          Explore full documentation & guides →
        </Link>
      </div>
    </Section>
  );
}

export default EmailFaqCard;
