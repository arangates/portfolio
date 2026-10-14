import { Hr } from "@react-email/components";
import type { CSSProperties } from "react";

interface EmailDividerProps {
  margin?: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function EmailDivider({
  margin,
  color,
  className = "my-6 border-t border-stroke",
  style,
}: EmailDividerProps) {
  const inlineStyles: CSSProperties = {
    ...(margin ? { margin } : {}),
    ...(color ? { borderTopColor: color } : {}),
    ...style,
  };

  return <Hr className={className} style={inlineStyles} />;
}

export default EmailDivider;
