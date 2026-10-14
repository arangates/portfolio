import { Link, Section, Text } from "@react-email/components";
import type React from "react";

export interface FaqItem {
  question: string;
  href: string;
}

export interface EmailFaqCardProps {
  title?: string;
  questions: FaqItem[];
  style?: React.CSSProperties;
  className?: string;
}

export function EmailFaqCard({
  title = "Your questions, answered",
  questions,
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
      {questions.map((item, idx) => (
        <div key={idx} style={{ marginBottom: idx === questions.length - 1 ? 0 : "10px" }}>
          <Link
            href={item.href}
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
      ))}
    </Section>
  );
}

export default EmailFaqCard;
