import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Code2Icon, WalletCardsIcon } from "lucide-react";

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
      {
        type: "button",
        text: "Open Selvam",
        url: "https://myselvam.vercel.app/",
        secondary: false,
      },
      ...(!sourceUrl
        ? [
            {
              type: "icon" as const,
              text: "GitHub",
              label: "GitHub",
              url: "https://github.com/arangates/portfolio",
              icon: <Code2Icon className="size-4" />,
            },
          ]
        : []),
    ],
    ...(sourceUrl ? { githubUrl: sourceUrl } : {}),
  };
}
