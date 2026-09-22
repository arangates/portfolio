"use client";

import "@assistant-ui/react-markdown/styles/dot.css";
import "katex/dist/katex.min.css";

import {
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { type ComponentProps, memo, useRef, useCallback, useState } from "react";
import { CopyIcon, CheckIcon } from "lucide-react";
import { cn } from "@portfolio/ui/lib/utils";

// Simple code block component with copy functionality
function CodeBlock({
  className,
  children,
  ...props
}: ComponentProps<"pre"> & { language?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(() => {
    const pre = ref.current;
    if (!pre) return;
    const code = pre.textContent ?? "";
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, []);

  return (
    <div className="border-foreground/10 rounded-document my-3 border bg-muted/30 overflow-hidden">
      <div className="border-foreground/10 bg-foreground/[0.025] dark:bg-foreground/[0.04] rounded-t-document flex h-9 items-center justify-between border-b px-3">
        <span className="text-muted-foreground font-mono text-[11px] [font-variant-ligatures:none]">
          {props.language || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="text-muted-foreground hover:text-foreground rounded-control grid size-6 place-items-center transition-colors"
        >
          {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </button>
      </div>
      <pre
        ref={ref}
        className={cn("overflow-x-auto p-3.5 text-[13px] leading-relaxed", className)}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}

// Table with copy functionality
function MarkdownTable({ className, children, ...props }: ComponentProps<"table">) {
  const ref = useRef<HTMLTableElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(() => {
    const table = ref.current;
    if (!table) return;

    const rows = [...table.querySelectorAll("tr")].map((row) =>
      [...row.querySelectorAll("th, td")].map((cell) =>
        (cell.textContent ?? "").replace(/\s+/g, " ").trim().replace(/[\\|]/g, "\\$&"),
      ),
    );
    if (rows.length === 0) return;

    const width = Math.max(...rows.map((row) => row.length));
    const pad = (row: string[]) =>
      `| ${Array.from({ length: width }, (_, i) => row[i] ?? "").join(" | ")} |`;
    const [header, ...body] = rows;

    const markdown = [
      pad(header!),
      `| ${Array.from({ length: width }, () => "---").join(" | ")} |`,
      ...body.map(pad),
    ].join("\n");

    navigator.clipboard.writeText(markdown).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, []);

  return (
    <figure className="border-foreground/10 rounded-document my-3 border">
      <div className="border-foreground/10 bg-foreground/[0.025] dark:bg-foreground/[0.04] rounded-t-document flex h-9 items-center justify-between border-b px-3">
        <span className="text-muted-foreground font-mono text-[11px] [font-variant-ligatures:none]">
          table
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy table as markdown"
          className="text-muted-foreground hover:text-foreground rounded-control grid size-6 place-items-center transition-colors"
        >
          {isCopied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table
          ref={ref}
          className={cn("w-full border-separate border-spacing-0 text-[13px]", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    </figure>
  );
}

const NoCodeHeader = () => null;

const SyntaxHighlighter = (props: { code: string; language?: string }) => (
  <CodeBlock language={props.language}>{props.code}</CodeBlock>
);

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

const defaultComponents = memoizeMarkdownComponents({
  SyntaxHighlighter,
  CodeHeader: NoCodeHeader,
  h1: ({ className, ...props }) => (
    <h1
      className={cn("mt-5 mb-2 scroll-m-20 text-xl font-semibold first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn("mt-5 mb-2 scroll-m-20 text-lg font-semibold first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-4 mb-1.5 scroll-m-20 text-base font-semibold first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "mt-3.5 mb-1 scroll-m-20 text-base font-medium first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn("mt-3 mb-1 text-sm font-semibold first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn("mt-3 mb-1 text-sm font-medium first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("my-3 leading-relaxed first:mt-0 last:mb-0", className)} {...props} />
  ),
  a: ({ className, href, children, ...props }: ComponentProps<"a">) => {
    // Handle internal dashboard links
    if (href?.startsWith("/dashboard")) {
      return (
        <a
          className={cn(
            "text-primary hover:text-primary/80 underline underline-offset-2",
            className,
          )}
          href={href}
          {...props}
        >
          {children}
        </a>
      );
    }
    // For external links or other internal links, just render as span to prevent navigation
    return (
      <span className={className} {...props}>
        {children}
      </span>
    );
  },
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "border-muted-foreground/30 text-muted-foreground my-3 border-s-2 ps-4",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("marker:text-muted-foreground my-3 ms-5 list-disc [&>li]:mt-1", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn("marker:text-muted-foreground my-3 ms-5 list-decimal [&>li]:mt-1", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("border-muted-foreground/20 my-3", className)} {...props} />
  ),
  table: ({ className, ...props }) => <MarkdownTable className={className} {...props} />,
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "border-foreground/10 border-b px-3 py-1.5 text-start font-medium [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "border-foreground/10 border-b px-3 py-1.5 text-start [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => <tr className={cn("m-0 p-0", className)} {...props} />,
  li: ({ className, ...props }) => <li className={cn("leading-relaxed", className)} {...props} />,
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold", className)} {...props} />
  ),
  sup: ({ className, ...props }) => (
    <sup className={cn("[&>a]:text-xs [&>a]:no-underline", className)} {...props} />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "border-border/50 bg-muted/30 overflow-x-auto rounded-xl border p-3.5 text-[13px] leading-relaxed",
        className,
      )}
      {...props}
    />
  ),
  code: function Code({ className, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        className={cn(
          !isCodeBlock && "bg-muted rounded-md px-1.5 py-0.5 font-mono text-[0.85em]",
          className,
        )}
        {...props}
      />
    );
  },
});

const MarkdownTextImpl = () => {
  return (
    <MarkdownTextPrimitive
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      className="aui-md [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1"
      components={defaultComponents}
      defer
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);
