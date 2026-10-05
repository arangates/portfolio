import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import {
  IconCard,
  IconCardGrid,
  InfoPanel,
  ShowcaseCard,
  ShowcaseGrid,
  ShowcaseSection,
  Step,
  Steps,
  Tab,
  Tabs,
} from "@/components/mdx-rich";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    IconCard,
    IconCardGrid,
    InfoPanel,
    ShowcaseCard,
    ShowcaseGrid,
    ShowcaseSection,
    Step,
    Steps,
    Tab,
    Tabs,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
