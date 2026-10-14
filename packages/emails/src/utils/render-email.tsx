import "server-only";

import { render } from "@react-email/render";
import type React from "react";

export function renderEmailToHTML(element: React.ReactElement): Promise<string> {
  return render(element);
}

function htmlToText(html: string) {
  return html
    .replace(/<\/(?:p|h[1-6])>/g, "\n\n")
    .replace(/<\/(?:div|tr)>/g, "\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function renderEmailToText(element: React.ReactElement): Promise<string> {
  return htmlToText(await renderEmailToHTML(element));
}

export async function renderEmail(
  element: React.ReactElement,
): Promise<{ html: string; text: string }> {
  const html = await renderEmailToHTML(element);
  return { html, text: htmlToText(html) };
}
