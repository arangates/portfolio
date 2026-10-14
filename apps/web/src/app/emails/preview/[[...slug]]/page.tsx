"use client";

import { use, useEffect, useState } from "react";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

const templates = [
  { id: "activation", name: "Activation", desc: "01-Barebone activation template" },
  { id: "welcome", name: "Welcome", desc: "New user onboarding walkthrough" },
  { id: "notification", name: "Reminders Digest", desc: "Financial reminders & calendar alerts" },
  { id: "bills", name: "Bills", desc: "Due date & payment urgency alerts" },
  { id: "contracts", name: "Contracts", desc: "Renewal & notice period alerts" },
  { id: "deposits", name: "Deposits", desc: "Deposit maturity & reinvestment tracking" },
  { id: "investments", name: "Investments", desc: "Portfolio valuation & 24h gain/loss" },
  { id: "test", name: "Test Email", desc: "Delivery configuration test" },
];

export default function EmailPreviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const initialSlug = resolvedParams.slug?.[0] || "activation";

  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialSlug);
  const [deviceWidth, setDeviceWidth] = useState<"desktop" | "mobile" | "full">("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "html" | "text">("preview");
  const [rawHtml, setRawHtml] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (resolvedParams.slug?.[0]) {
      setSelectedTemplate(resolvedParams.slug[0]);
    }
  }, [resolvedParams.slug]);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    async function fetchEmailData() {
      try {
        const [htmlRes, textRes] = await Promise.all([
          fetch(`/api/emails/preview/${selectedTemplate}?format=html`),
          fetch(`/api/emails/preview/${selectedTemplate}?format=text`),
        ]);

        const htmlData = await htmlRes.text();
        const textData = await textRes.text();

        if (!isCancelled) {
          setRawHtml(htmlData);
          setRawText(textData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load email preview:", err);
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchEmailData();

    return () => {
      isCancelled = true;
    };
  }, [selectedTemplate]);

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const iframeWidths = {
    mobile: "375px",
    desktop: "640px",
    full: "100%",
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-black font-bold flex items-center justify-center text-sm">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white">Email Preview Playground</h1>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                01-Barebone
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive preview and testing for all Selvam email templates
            </p>
          </div>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2">
          {/* Format Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === "preview"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setViewMode("html")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === "html"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              HTML Source
            </button>
            <button
              onClick={() => setViewMode("text")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === "text"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Plain Text
            </button>
          </div>

          {/* Width Switcher (Only in preview mode) */}
          {viewMode === "preview" && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex">
              <button
                onClick={() => setDeviceWidth("desktop")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  deviceWidth === "desktop"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Desktop 640px"
              >
                Desktop
              </button>
              <button
                onClick={() => setDeviceWidth("mobile")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  deviceWidth === "mobile"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Mobile 375px"
              >
                Mobile
              </button>
              <button
                onClick={() => setDeviceWidth("full")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  deviceWidth === "full"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Full Width"
              >
                100%
              </button>
            </div>
          )}

          {/* Open Standalone Button */}
          <a
            href={`/api/emails/preview/${selectedTemplate}?format=html`}
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5"
          >
            <span>Open in Tab</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Template Navigation */}
        <aside className="w-64 border-r border-slate-800 bg-slate-950 p-4 shrink-0 overflow-y-auto hidden md:block">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Email Templates ({templates.length})
          </div>
          <nav className="space-y-1">
            {templates.map((tpl) => {
              const active = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex flex-col gap-0.5 ${
                    active
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium"
                      : "text-slate-300 hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <span className="font-semibold">{tpl.name}</span>
                  <span className="text-[11px] text-slate-400 truncate">{tpl.desc}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Viewer Area */}
        <main className="flex-1 flex flex-col bg-slate-900/50 p-4 sm:p-6 overflow-y-auto items-center">
          {/* Mobile Template Selector Bar (for small screens) */}
          <div className="md:hidden w-full max-w-xl mb-4">
            <label className="text-xs text-slate-400 block mb-1">Select Template:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500 border-r-2 border-transparent mb-3" />
                <p className="text-xs text-slate-400">Rendering template...</p>
              </div>
            </div>
          ) : viewMode === "preview" ? (
            <div
              className="w-full transition-all duration-200 flex flex-col items-center"
              style={{ maxWidth: iframeWidths[deviceWidth] }}
            >
              <div className="w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700/50">
                <iframe
                  key={`${selectedTemplate}-${deviceWidth}`}
                  srcDoc={rawHtml}
                  title={`${selectedTemplate} Preview`}
                  className="w-full border-0"
                  style={{
                    height: "880px",
                    display: "block",
                  }}
                />
              </div>
            </div>
          ) : viewMode === "html" ? (
            <div className="w-full max-w-4xl bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[820px]">
              <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">Generated HTML Output</span>
                <button
                  onClick={() => copyToClipboard(rawHtml)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded border border-slate-700 transition"
                >
                  {copied ? "Copied!" : "Copy HTML"}
                </button>
              </div>
              <pre className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-auto whitespace-pre leading-relaxed">
                {rawHtml}
              </pre>
            </div>
          ) : (
            <div className="w-full max-w-2xl bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[820px]">
              <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">Plain Text Version</span>
                <button
                  onClick={() => copyToClipboard(rawText)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded border border-slate-700 transition"
                >
                  {copied ? "Copied!" : "Copy Text"}
                </button>
              </div>
              <pre className="flex-1 p-6 font-mono text-xs text-slate-300 overflow-auto whitespace-pre-wrap leading-relaxed">
                {rawText}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
