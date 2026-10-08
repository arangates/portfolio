import { Section, Column, Row } from "@react-email/components";
import { Children, type CSSProperties } from "react";

interface EmailCardProps {
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  backgroundColor?: string;
  border?: boolean;
  style?: CSSProperties;
}

export function EmailCard({
  children,
  padding = "md",
  backgroundColor = "#ffffff",
  border = true,
  style,
}: EmailCardProps) {
  const paddings = {
    sm: "16px",
    md: "24px",
    lg: "32px",
  };

  return (
    <Section
      style={{
        backgroundColor,
        borderRadius: "12px",
        padding: paddings[padding],
        border: border ? "1px solid #e2e8f0" : "none",
        margin: "16px 0",
        ...style,
      }}
    >
      {children}
    </Section>
  );
}

// Grid components for responsive layouts
interface EmailGridProps {
  children: React.ReactNode;
  columns: 2 | 3 | 4;
  gap?: string;
}

export function EmailGrid({ children, columns = 2, gap = "16px" }: EmailGridProps) {
  const columnCount = columns;
  const columnWidth = `${100 / columnCount}%`;

  return (
    <Row style={{ gap }}>
      {Children.map(children, (child, index) => (
        <Column key={index} style={{ width: columnWidth }}>
          {child}
        </Column>
      ))}
    </Row>
  );
}

export default EmailCard;
