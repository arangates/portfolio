export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { isSovereignMode, ensureSovereignReady } = await import("@portfolio/db");
      if (isSovereignMode()) {
        console.log("[Selvam Sovereign Engine] Initializing embedded database & tables...");
        await ensureSovereignReady();
        console.log("[Selvam Sovereign Engine] Embedded database ready for offline operations.");
      }
    } catch (error) {
      console.error("[Selvam Sovereign Engine] Failed to initialize embedded database:", error);
    }
  }
}
