import { Column, Img, Row, Section, Text } from "@react-email/components";
import type React from "react";
import { emailConfig } from "../config";

export interface EmailFeatureCardProps {
  icon:
    | "users"
    | "bank"
    | "refresh"
    | "shield"
    | "chart"
    | "bell"
    | "calendar"
    | "check"
    | "bill"
    | "contract"
    | "vault"
    | "pie";
  title: string;
  description: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function EmailFeatureCard({
  icon,
  title,
  description,
  badge,
  badgeColor = "#166534",
  badgeBg = "#DCFCE7",
  style,
  className = "",
}: EmailFeatureCardProps) {
  const iconSrc = `${emailConfig.baseUrl}/email-assets/icon-${icon}.png`;

  return (
    <Section
      className={`bg-[#F2F4F2] rounded-[16px] p-5 mb-3.5 text-left ${className}`}
      style={{
        backgroundColor: "#F2F4F2",
        borderRadius: "16px",
        padding: "16px 18px",
        marginBottom: "12px",
        ...style,
      }}
    >
      <Row>
        <Column className="w-[52px] align-top pr-3.5" style={{ width: "52px" }}>
          <Img
            src={iconSrc}
            alt=""
            width={44}
            height={44}
            style={{
              display: "block",
              width: "44px",
              height: "44px",
              borderRadius: "9999px",
            }}
          />
        </Column>
        <Column className="align-middle">
          <div style={{ marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "#0E1318",
                fontFamily: "Inter, system-ui, sans-serif",
                verticalAlign: "middle",
              }}
            >
              {title}
            </span>
            {badge && (
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  marginLeft: "8px",
                  verticalAlign: "middle",
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {badge}
              </span>
            )}
          </div>
          <Text
            style={{
              fontSize: "13.5px",
              lineHeight: "1.5",
              color: "#4B5563",
              margin: 0,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {description}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

export default EmailFeatureCard;
