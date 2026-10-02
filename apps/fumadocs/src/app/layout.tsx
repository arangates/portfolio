import { RootProvider } from "fumadocs-ui/provider/next";

import "./global.css";
import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Selvam",
    template: "%s · Selvam",
  },
  description: "Product, architecture, data and deployment documentation for Selvam.",
};

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-fd-background focus:px-4 focus:py-3 focus:text-fd-foreground focus:ring-2 focus:ring-fd-primary focus:ring-offset-2"
        >
          Skip to content
        </a>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
