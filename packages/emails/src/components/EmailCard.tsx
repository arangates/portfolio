import { Section, Column, Row } from "@react-email/components";
import { Children, type CSSProperties } from "react";

interface EmailCardProps {
  children: React.ReactNode;
  variant?: "hero" | "item" | "stat" | "default";
  padding?: "sm" | "md" | "lg";
  backgroundColor?: string;
  border?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function EmailCard({
  children,
  variant = "default",
  padding,
  backgroundColor,
  border,
  className = "",
  style,
}: EmailCardProps) {
  let baseClasses = "";

  switch (variant) {
    case "hero":
      baseClasses =
        "bg-bg-2 mobile:px-6 mobile:py-12 rounded-[8px] px-[40px] py-[64px] text-center";
      break;
    case "item":
      baseClasses = "bg-bg border border-stroke rounded-[8px] p-4 text-left my-2";
      break;
    case "stat":
      baseClasses = "bg-bg border border-stroke rounded-[8px] p-3 text-center";
      break;
    default:
      baseClasses = "bg-bg-2 rounded-[8px] mobile:px-5 mobile:py-8 px-[32px] py-[40px]";
      break;
  }

  const paddings = {
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  const customPaddingClass = padding ? paddings[padding] : "";
  const borderClass = border === true ? "border border-stroke" : border === false ? "border-0" : "";
  const combinedClasses = [baseClasses, customPaddingClass, borderClass, className]
    .filter(Boolean)
    .join(" ");

  const inlineStyles: CSSProperties = {
    ...(backgroundColor ? { backgroundColor } : {}),
    ...style,
  };

  return (
    <Section className={combinedClasses} style={inlineStyles}>
      {children}
    </Section>
  );
}

// Grid components for responsive layouts
interface EmailGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: string;
  className?: string;
}

export function EmailGrid({ children, columns = 2, gap = "12px", className = "" }: EmailGridProps) {
  const columnCount = columns;
  const columnWidth = `${100 / columnCount}%`;

  return (
    <Row style={{ gap }} className={className}>
      {Children.map(children, (child, index) => (
        <Column key={index} style={{ width: columnWidth }}>
          {child}
        </Column>
      ))}
    </Row>
  );
}

export default EmailCard;
