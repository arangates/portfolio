import { Button } from "@react-email/components";
import type { CSSProperties } from "react";

export interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "pill" | "pill-outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function EmailButton({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth = true,
  className = "",
  style,
}: EmailButtonProps) {
  const sizeClasses = {
    sm: "px-5 py-2.5 text-[13px]",
    md: "px-7 py-3.5 text-[15px]",
    lg: "px-8 py-4 text-[16px]",
  };

  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      backgroundColor: "#163300",
      color: "#FFFFFF",
      borderRadius: "9999px",
      fontWeight: 700,
    },
    pill: {
      backgroundColor: "#163300",
      color: "#FFFFFF",
      borderRadius: "9999px",
      fontWeight: 700,
    },
    outline: {
      backgroundColor: "#FFFFFF",
      color: "#163300",
      border: "1.5px solid #163300",
      borderRadius: "9999px",
      fontWeight: 700,
    },
    "pill-outline": {
      backgroundColor: "#FFFFFF",
      color: "#163300",
      border: "1.5px solid #163300",
      borderRadius: "9999px",
      fontWeight: 700,
    },
    secondary: {
      backgroundColor: "#F2F4F2",
      color: "#163300",
      borderRadius: "9999px",
      fontWeight: 700,
    },
  };

  const fullWidthClass = fullWidth ? "w-full block text-center" : "inline-block text-center";

  const combinedClasses = [
    "font-sans leading-6 no-underline text-center cursor-pointer",
    sizeClasses[size],
    fullWidthClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const combinedStyles: CSSProperties = {
    display: fullWidth ? "block" : "inline-block",
    boxSizing: "border-box",
    textAlign: "center",
    textDecoration: "none",
    ...variantStyles[variant],
    ...style,
  };

  return (
    <Button href={href} className={combinedClasses} style={combinedStyles}>
      {children}
    </Button>
  );
}

export default EmailButton;
