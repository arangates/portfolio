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
  icons: {
    icon: [
      {
        url: "/favicon/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/favicon-96x96-dark.png",
        sizes: "96x96",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon/apple-touch-icon-dark.png",
        sizes: "180x180",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  title: "Selvam",
  description: "A private multi-currency portfolio and wealth tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f5" },
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
