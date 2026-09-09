import { cookies } from "next/headers";
import { AmountPreferences } from "@/components/amount-preferences";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../index.css";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Selvam",
  appleWebApp: { capable: true, title: "Selvam", statusBarStyle: "default" },
  icons: { apple: "/favicon/apple-touch-icon.png" },
  title: "Selvam",
  description: "A private multi-currency portfolio and wealth tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const amountMode =
    (await cookies()).get("selvam-amount-mode")?.value === "exact" ? "exact" : "compact";
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AmountPreferences initialMode={amountMode}>{children}</AmountPreferences>
        </Providers>
      </body>
    </html>
  );
}
