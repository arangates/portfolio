import { Hr } from "@react-email/components";

interface EmailDividerProps {
  margin?: string;
  color?: string;
}

export function EmailDivider({ margin = "24px 0", color = "#e2e8f0" }: EmailDividerProps) {
  return <Hr style={{ margin, border: "none", borderTop: `1px solid ${color}` }} />;
}

export default EmailDivider;
