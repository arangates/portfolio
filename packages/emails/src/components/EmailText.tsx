import { Heading, Text } from "@react-email/components";
import type { CSSProperties } from "react";

interface EmailTextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "body" | "caption" | "small";
  color?: string;
  weight?: "normal" | "medium" | "bold";
  align?: "left" | "center" | "right";
  marginBottom?: string;
  marginTop?: string;
  className?: string;
  style?: CSSProperties;
}

export function EmailText({
  children,
  variant = "body",
  color,
  weight,
  align = "left",
  marginBottom,
  marginTop,
  className = "",
  style,
}: EmailTextProps) {
  const variantClasses = {
    h1: "font-28 text-fg m-0 font-sans tracking-tight",
    h2: "font-24 text-fg m-0 font-sans tracking-tight",
    h3: "font-16 font-semibold text-fg m-0 font-sans",
    body: "font-16 text-fg-2 m-0 font-sans leading-relaxed",
    caption: "font-13 text-fg-3 m-0 font-sans",
    small: "font-11 text-fg-3 m-0 font-sans",
  };

  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  const weightClass =
    weight === "bold" ? "font-bold" : weight === "medium" ? "font-medium" : "font-normal";

  const combinedClasses = [
    variantClasses[variant],
    alignClass,
    weight ? weightClass : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineStyles: CSSProperties = {
    ...(color ? { color } : {}),
    ...(marginBottom ? { marginBottom } : {}),
    ...(marginTop ? { marginTop } : {}),
    ...style,
  };

  if (variant === "h1" || variant === "h2") {
    return (
      <Heading as={variant} className={combinedClasses} style={inlineStyles}>
        {children}
      </Heading>
    );
  }

  return (
    <Text className={combinedClasses} style={inlineStyles}>
      {children}
    </Text>
  );
}

// Special text components for common use cases
export function EmailHeading({
  children,
  variant = "h1",
  className = "",
  ...props
}: Omit<EmailTextProps, "variant"> & { variant?: EmailTextProps["variant"] }) {
  return (
    <EmailText variant={variant} className={className} {...props}>
      {children}
    </EmailText>
  );
}

export function EmailSubheading({
  children,
  className = "",
  ...props
}: Omit<EmailTextProps, "variant">) {
  return (
    <EmailText variant="h3" className={className} {...props}>
      {children}
    </EmailText>
  );
}

export function EmailBody({ children, className = "", ...props }: Omit<EmailTextProps, "variant">) {
  return (
    <EmailText variant="body" className={className} {...props}>
      {children}
    </EmailText>
  );
}

export function EmailCaption({
  children,
  className = "",
  ...props
}: Omit<EmailTextProps, "variant">) {
  return (
    <EmailText variant="caption" className={className} {...props}>
      {children}
    </EmailText>
  );
}

export default EmailText;
