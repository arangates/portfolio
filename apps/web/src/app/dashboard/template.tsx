import { ViewLoaded } from "@/components/pwa-controls";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ViewLoaded requestId={new Date().toISOString()} />
    </>
  );
}
