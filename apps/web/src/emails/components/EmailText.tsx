import { Text } from "@react-email/components";

interface EmailTextProps {
  children: React.ReactNode;
  variant?: "h1" | "h2" | "h3" | "body" | "caption" | "small";
  color?: string;
  weight?: "normal" | "medium" | "bold";
  align?: "left" | "center" | "right";
  marginBottom?: string;
  marginTop?: string;
}

export function EmailText({
  children,
  variant = "body",
  color = "#0f172a",
  weight = "normal",
  align = "left",
  marginBottom,
  marginTop,
}: EmailTextProps) {
  const styles = {
    h1: { fontSize: "32px", lineHeight: "1.2", fontWeight: 700 },
    h2: { fontSize: "24px", lineHeight: "1.3", fontWeight: 600 },
    h3: { fontSize: "20px", lineHeight: "1.4", fontWeight: 600 },
    body: { fontSize: "16px", lineHeight: "1.5", fontWeight: 400 },
    caption: { fontSize: "14px", lineHeight: "1.4", fontWeight: 400 },
    small: { fontSize: "12px", lineHeight: "1.4", fontWeight: 400 },
  };

  const weights = {
    normal: 400,
    medium: 500,
    bold: 600,
  };

  return (
    <Text
      style={{
        ...styles[variant],
        color,
        fontWeight: weights[weight],
        textAlign: align,
        margin: "0",
        marginBottom: marginBottom || (variant === "h1" || variant === "h2" ? "16px" : undefined),
        marginTop: marginTop || (variant === "h1" ? "24px" : variant === "h2" ? "20px" : undefined),
      }}
    >
      {children}
    </Text>
  );
}

// Special text components for common use cases
export function EmailHeading({
  children,
  variant = "h2",
  ...props
}: Omit<EmailTextProps, "variant"> & { variant?: EmailTextProps["variant"] }) {
  return (
    <EmailText variant={variant} {...props}>
      {children}
    </EmailText>
  );
}

export function EmailSubheading({ children, ...props }: Omit<EmailTextProps, "variant">) {
  return (
    <EmailText variant="h3" color="#475569" {...props}>
      {children}
    </EmailText>
  );
}

export function EmailBody({ children, ...props }: Omit<EmailTextProps, "variant">) {
  return (
    <EmailText variant="body" {...props}>
      {children}
    </EmailText>
  );
}

export function EmailCaption({ children, ...props }: Omit<EmailTextProps, "variant">) {
  return (
    <EmailText variant="caption" color="#64748b" {...props}>
      {children}
    </EmailText>
  );
}

export default EmailText;
