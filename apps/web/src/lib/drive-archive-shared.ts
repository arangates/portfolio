export const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export type DriveArchiveStatus =
  | "stored"
  | "already_stored"
  | "not_connected"
  | "disabled"
  | "failed";

export function driveArchiveResultText(status?: DriveArchiveStatus) {
  if (status === "stored") return " Source file saved to Google Drive.";
  if (status === "already_stored") return " Source file was already in Google Drive.";
  if (status === "failed") return " Import succeeded, but the Drive archive needs attention.";
  if (status === "disabled") return " Google Drive archiving is paused.";
  if (status === "not_connected")
    return " Connect Google Drive in Settings to retain source files.";
  return "";
}

export function driveArchiveSourceLabel(sourceType: string) {
  if (sourceType === "zerodha_holdings") return "Zerodha holdings";
  if (sourceType === "zerodha_tradebook") return "Zerodha tradebook";
  if (sourceType === "degiro_transactions") return "Degiro transactions";
  if (sourceType === "degiro_account") return "Degiro account statement";
  if (sourceType === "salary_payslip") return "Salary payslip";
  if (sourceType === "india_income_tax") return "Indian income tax";
  if (sourceType === "netherlands_income_tax") return "Dutch income tax";
  return sourceType;
}
