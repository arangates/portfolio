import { loader } from "fumadocs-core/source";
import type { LoaderPlugin } from "fumadocs-core/source";
import { createElement } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react/lib";
import { AppWindowIcon } from "@phosphor-icons/react/dist/ssr/AppWindow";
import { BookOpenIcon } from "@phosphor-icons/react/dist/ssr/BookOpen";
import { ChartDonutIcon } from "@phosphor-icons/react/dist/ssr/ChartDonut";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/ssr/ChartLineUp";
import { ChatsCircleIcon } from "@phosphor-icons/react/dist/ssr/ChatsCircle";
import { DatabaseIcon } from "@phosphor-icons/react/dist/ssr/Database";
import { FireIcon } from "@phosphor-icons/react/dist/ssr/Fire";
import { GraphIcon } from "@phosphor-icons/react/dist/ssr/Graph";
import { KeyIcon } from "@phosphor-icons/react/dist/ssr/Key";
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr/Receipt";
import { RocketLaunchIcon } from "@phosphor-icons/react/dist/ssr/RocketLaunch";
import { RobotIcon } from "@phosphor-icons/react/dist/ssr/Robot";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { SlidersHorizontalIcon } from "@phosphor-icons/react/dist/ssr/SlidersHorizontal";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { SquaresFourIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";

import { docsContentRoute, docsImageRoute, docsRoute } from "./shared";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

const solidIconMap: Record<string, PhosphorIcon> = {
  AppWindow: AppWindowIcon,
  BookOpen: BookOpenIcon,
  "book-open": BookOpenIcon,
  Bot: RobotIcon,
  "wallet-cards": WalletIcon,
  blocks: StackIcon,
  ChartLine: ChartLineIcon,
  ChartNoAxesCombined: ChartLineUpIcon,
  ChartPie: ChartDonutIcon,
  Database: DatabaseIcon,
  Flame: FireIcon,
  KeyRound: KeyIcon,
  Layers: StackIcon,
  MessagesSquare: ChatsCircleIcon,
  Network: GraphIcon,
  PanelsTopLeft: SquaresFourIcon,
  Receipt: ReceiptIcon,
  Rocket: RocketLaunchIcon,
  ShieldCheck: ShieldCheckIcon,
  "shield-check": ShieldCheckIcon,
  SlidersHorizontal: SlidersHorizontalIcon,
  Sparkles: SparkleIcon,
  Trash2: TrashIcon,
  Wallet: WalletIcon,
  WalletCards: WalletIcon,
};

function resolveSolidIcon(iconName?: string) {
  const Icon = iconName ? solidIconMap[iconName] : undefined;
  return Icon ? createElement(Icon, { size: 16, weight: "fill" }) : undefined;
}

const solidIconsPlugin: LoaderPlugin = {
  name: "fumadocs:solid-icons",
  transformPageTree: {
    file: (node) =>
      typeof node.icon === "string" ? { ...node, icon: resolveSolidIcon(node.icon) } : node,
    folder: (node) =>
      typeof node.icon === "string" ? { ...node, icon: resolveSolidIcon(node.icon) } : node,
    separator: (node) =>
      typeof node.icon === "string" ? { ...node, icon: resolveSolidIcon(node.icon) } : node,
  },
};

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [solidIconsPlugin],
});

export function getPageImageUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url: "/" + [page.locale, ...docsImageRoute.split("/"), ...segments].filter(Boolean).join("/"),
  };
}

export function getPageMarkdownUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url: "/" + [page.locale, ...docsContentRoute.split("/"), ...segments].filter(Boolean).join("/"),
  };
}

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})

${processed}`;
}
