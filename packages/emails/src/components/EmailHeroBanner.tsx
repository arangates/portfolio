import { Img, Section } from "@react-email/components";
import type React from "react";
import { emailConfig } from "../config";

export interface EmailHeroBannerProps {
  type?: "alert" | "wealth" | "security";
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function EmailHeroBanner({
  type = "alert",
  alt = "Selvam update",
  style,
  className = "",
}: EmailHeroBannerProps) {
  const filename =
    type === "wealth"
      ? "hero-banner-wealth.png"
      : type === "security"
        ? "hero-banner-security.png"
        : "hero-banner-alert.png";

  const src = `${emailConfig.baseUrl}/email-assets/${filename}`;

  return (
    <Section className={`my-6 text-center ${className}`} style={style}>
      <Img
        src={src}
        alt={alt}
        width={560}
        height={160}
        className="w-full max-w-[560px] rounded-[16px] object-cover"
        style={{
          display: "block",
          margin: "0 auto",
          width: "100%",
          maxWidth: "560px",
          height: "auto",
          borderRadius: "16px",
          border: "none",
          outline: "none",
        }}
      />
    </Section>
  );
}

export default EmailHeroBanner;
