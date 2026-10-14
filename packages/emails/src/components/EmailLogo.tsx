import { Img, Link } from "@react-email/components";
import type React from "react";
import { emailConfig } from "../config";

export interface EmailLogoProps {
  /**
   * Size in pixels.
   * For "icon" or "mark": sets both width and height (default: 40).
   * For "wordmark": sets height (default: 42), with width computed automatically.
   */
  size?: number;
  width?: number;
  height?: number;
  /**
   * Visual variant:
   * - "wordmark": Full horizontal brand logo with mark + "selvam" typography (matches Wise header).
   * - "icon": Brand mark inside a rounded dark neutral container.
   * - "mark": Transparent vector brand mark without container.
   * @default "wordmark"
   */
  variant?: "wordmark" | "icon" | "mark";
  /**
   * Optional URL to link the logo to (e.g. website or dashboard).
   */
  href?: string;
  /**
   * Optional custom styling.
   */
  style?: React.CSSProperties;
  /**
   * Optional CSS class.
   */
  className?: string;
}

export function EmailLogo({
  size,
  width,
  height,
  variant = "wordmark",
  href,
  style,
  className,
}: EmailLogoProps) {
  let src = "";
  let imgWidth = 0;
  let imgHeight = 0;
  let borderRadius = "0";

  if (variant === "wordmark") {
    src = `${emailConfig.baseUrl}/email-assets/selvam-wordmark.png`;
    // Aspect ratio of cropped Selvam wordmark is 433 / 98 = ~4.418
    imgHeight = height || size || 42;
    imgWidth = width || Math.round(imgHeight * 4.418);
  } else if (variant === "mark") {
    src = `${emailConfig.baseUrl}/selvam-logo.png`;
    const s = size || width || height || 40;
    imgWidth = width || s;
    imgHeight = height || s;
  } else {
    // "icon"
    src = `${emailConfig.baseUrl}/selvam-icon.png`;
    const s = size || width || height || 40;
    imgWidth = width || s;
    imgHeight = height || s;
    borderRadius = imgWidth >= 40 ? "10px" : "6px";
  }

  const image = (
    <Img
      src={src}
      alt={emailConfig.appName}
      width={imgWidth}
      height={imgHeight}
      className={className}
      style={{
        display: "block",
        margin: "0 auto",
        outline: "none",
        border: "none",
        textDecoration: "none",
        borderRadius,
        verticalAlign: "middle",
        maxWidth: "100%",
        ...style,
      }}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{
          display: "inline-block",
          textDecoration: "none",
          outline: "none",
          border: "none",
        }}
      >
        {image}
      </Link>
    );
  }

  return image;
}

export default EmailLogo;
