import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { BookOpenIcon } from "lucide-react";

import { baseOptions } from "@/lib/layout.shared";
import { source } from "@/lib/source";

export default function Layout({ children }: LayoutProps<"/docs">) {
  const options = baseOptions();

  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...options}
      nav={{ ...options.nav, mode: "top" }}
      tabs={[
        {
          title: "Handbook",
          description: "Selvam product and engineering docs",
          url: "/docs",
          icon: <BookOpenIcon className="size-4" />,
        },
      ]}
      containerProps={{ className: "coolify-docs" }}
    >
      {children}
    </DocsLayout>
  );
}
