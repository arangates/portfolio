import type { TailwindConfig } from "@react-email/tailwind";

// Tailwind configuration for React Email
// This allows us to use Tailwind CSS classes in our email templates
export const tailwindConfig: TailwindConfig = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["Inter", "Helvetica", "Arial", "sans-serif"],
        mono: ["Menlo", "Monaco", "Courier New", "monospace"],
      },
    },
  },
};

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || "Selvam <notifications@selvam.app>",
  baseUrl: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  appName: "Selvam",
  supportEmail: "support@selvam.app",

  // Default styles for emails
  styles: {
    container: {
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
    },
    button: {
      backgroundColor: "#0ea5e9",
      color: "#ffffff",
      padding: "12px 24px",
      borderRadius: "6px",
      textDecoration: "none",
      display: "inline-block",
      fontWeight: "600",
    },
    link: {
      color: "#0ea5e9",
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
  Bills: "#ef4444", // red-500
  Contracts: "#f97316", // orange-500
  Deposits: "#22c55e", // green-500
  Investments: "#3b82f6", // blue-500
  Salary: "#8b5cf6", // violet-500
  Tax: "#6366f1", // indigo-500
  Planning: "#06b6d4", // cyan-500
  Purchases: "#ec4899", // pink-500
  Imports: "#14b8a6", // teal-500
  Valuations: "#f59e0b", // amber-500
  "Bank transactions": "#10b981", // emerald-500
};
