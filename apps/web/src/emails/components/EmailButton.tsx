import { Link } from "@react-email/components";
import type { CSSProperties } from "react";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  style?: CSSProperties;
}

export function EmailButton({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  style,
}: EmailButtonProps) {
  const baseStyles = {
    display: "inline-block",
    textDecoration: "none",
    borderRadius: "8px",
    fontWeight: 600,
    transition: "all 0.2s ease",
  };

  const sizes = {
    sm: { padding: "8px 16px", fontSize: "14px" },
    md: { padding: "12px 24px", fontSize: "16px" },
    lg: { padding: "16px 32px", fontSize: "18px" },
  };

  const variants = {
    primary: {
      backgroundColor: "#0ea5e9",
      color: "#ffffff",
      border: "none",
    },
    secondary: {
      backgroundColor: "#64748b",
      color: "#ffffff",
      border: "none",
    },
    outline: {
      backgroundColor: "transparent",
      color: "#0ea5e9",
      border: "2px solid #0ea5e9",
    },
  };

  return (
    <Link
      href={href}
      style={{
        ...baseStyles,
        ...sizes[size],
        ...variants[variant],
        width: fullWidth ? "100%" : "auto",
        textAlign: fullWidth ? "center" : "inherit",
        ...style,
      }}
    >
      {children}
    </Link>
  );
}

export default EmailButton;
