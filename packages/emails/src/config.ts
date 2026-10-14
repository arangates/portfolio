import { barebonesBoxedTailwindConfig, barebonesTailwindConfig, colors, fontScale } from "./theme";

export { barebonesBoxedTailwindConfig, barebonesTailwindConfig, colors, fontScale };

// Tailwind configuration for React Email (defaults to Barebones)
export const tailwindConfig = barebonesBoxedTailwindConfig;

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || "Selvam <notifications@selvam.app>",
  baseUrl: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  appName: "Selvam",
  supportEmail: "support@selvam.app",
  docsUrl: process.env.NEXT_PUBLIC_DOCS_URL || "https://docs-selvam.vercel.app/docs",

  // Default styles for emails matching Barebone minimalist tokens
  styles: {
    container: {
      maxWidth: "640px",
      margin: "0 auto",
      padding: "20px",
    },
    button: {
      backgroundColor: "#14171E",
      color: "#FFFFFF",
      padding: "16px 28px",
      borderRadius: "8px",
      textDecoration: "none",
      display: "inline-block",
      fontWeight: "500",
      fontFamily: "Inter, system-ui, Arial, sans-serif",
    },
    link: {
      color: "#14171E",
      textDecoration: "underline",
    },
  },
};

// Notification categories that should have dedicated email templates
export const emailTemplateCategories = [
  "Bills",
  "Contracts",
  "Deposits",
  "Investments",
  "Salary",
  "Tax",
  "Planning",
  "Purchases",
  "Imports",
  "Valuations",
  "Bank transactions",
] as const;

// Map of notification categories to icons (using emoji for email compatibility)
export const categoryIcons: Record<string, string> = {
  Bills: "💰",
  Contracts: "📋",
  Deposits: "🏦",
  Investments: "📈",
  Salary: "💵",
  Tax: "🧾",
  Planning: "📅",
  Purchases: "🛒",
  Imports: "📥",
  Valuations: "💎",
  "Bank transactions": "🏧",
};

// Map of notification categories to colors
export const categoryColors: Record<string, string> = {
  Bills: "#dc2626", // red-600
  Contracts: "#ea580c", // orange-600
  Deposits: "#16a34a", // green-600
  Investments: "#2563eb", // blue-600
  Salary: "#7c3aed", // violet-600
  Tax: "#4f46e5", // indigo-600
  Planning: "#0891b2", // cyan-600
  Purchases: "#db2777", // pink-600
  Imports: "#0d9488", // teal-600
  Valuations: "#d97706", // amber-600
  "Bank transactions": "#059669", // emerald-600
};
