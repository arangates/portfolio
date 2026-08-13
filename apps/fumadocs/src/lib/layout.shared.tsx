import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { WalletCardsIcon } from "lucide-react";

import { appName } from "./shared";

export function baseOptions(): BaseLayoutProps {
  const sourceUrl = process.env.NEXT_PUBLIC_SOURCE_URL;

  return {
    nav: {
      title: (
        <span className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-fd-primary text-fd-primary-foreground shadow-sm">
            <WalletCardsIcon className="size-4" />
          </span>
          {appName}
        </span>
      ),
      transparentMode: "top",
    },
    links: [
      { text: "Features", url: "/docs/features", active: "nested-url" },
      { text: "Architecture", url: "/docs/architecture", active: "nested-url" },
      { text: "Security", url: "/docs/security", active: "nested-url" },
      { type: "button", text: "Read the docs", url: "/docs", secondary: false },
    ],
    ...(sourceUrl ? { githubUrl: sourceUrl } : {}),
  };
}
