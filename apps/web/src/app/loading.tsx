export default function AppLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#f5f8f5] px-6 text-[#173c31] dark:bg-[#171717] dark:text-[#f5f5f5]"
    >
      <div
        role="img"
        aria-label="Selvam"
        className="app-loading-icon size-16 rounded-[18px] bg-cover shadow-[0_8px_24px_rgba(6,59,53,0.18)]"
      />
      <div className="text-center">
        <p className="text-lg font-semibold tracking-tight">Selvam</p>
        <p className="mt-1 text-sm text-[#557066] dark:text-[#aaa]">Preparing your portfolio…</p>
      </div>
      <span
        aria-hidden="true"
        className="mt-1 size-5 animate-spin rounded-full border-2 border-[#0f8f70]/20 border-t-[#0f8f70] dark:border-[#40cda5]/20 dark:border-t-[#40cda5]"
      />
    </main>
  );
}
