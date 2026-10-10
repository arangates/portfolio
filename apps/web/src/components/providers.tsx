"use client";

import { IconContext } from "@phosphor-icons/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@portfolio/ui/components/sonner";

import { queryClient } from "@/utils/trpc";

import { PwaProvider } from "./pwa-controls";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <IconContext.Provider value={{ weight: "regular" }}>
        <PwaProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools />
          </QueryClientProvider>
        </PwaProvider>
        <Toaster richColors />
      </IconContext.Provider>
    </ThemeProvider>
  );
}
