import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/components/settings-tabs";
import { GoogleDriveArchiveCard } from "@/components/google-drive-archive-card";
import { getDriveArchiveState } from "@/lib/google-drive-archive";
import { FireSettingsCard } from "@/components/fire-settings-card";
import {
  AccountForm,
  DataControls,
  DeleteAccountCard,
  ExchangeRateForm,
  PreferenceForm,
  SecurityForm,
} from "@/components/settings-forms";
import { getLatestExchangeRates, getPortfolioPreference } from "@portfolio/api/portfolio-queries";
import { getFireSettings } from "@portfolio/api/fire-queries";
import { auth } from "@portfolio/auth";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [preference, rates, fireSettings, driveArchive] = await Promise.all([
    getPortfolioPreference(session.user.id),
    getLatestExchangeRates(session.user.id),
    getFireSettings(session.user.id),
    getDriveArchiveState(session.user.id),
  ]);
  const requestedTab = (await searchParams).tab;
  const defaultTab =
    requestedTab === "portfolio" || requestedTab === "planning" || requestedTab === "security"
      ? requestedTab
      : "account";
  const driveSummary = {
    available: driveArchive.available,
    connected: driveArchive.connected,
    refreshReady: driveArchive.refreshReady,
    enabled: driveArchive.enabled,
    rootFolderReady: driveArchive.rootFolderReady,
    documentCount: driveArchive.documentCount,
    storedCount: driveArchive.storedCount,
    failedCount: driveArchive.failedCount,
  };
  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Settings"
          description="Manage your account, portfolio defaults, family planning and data security."
        />
        <SettingsTabs
          defaultValue={defaultTab}
          account={<AccountForm name={session.user.name} email={session.user.email} />}
          portfolio={
            <>
              <PreferenceForm preference={preference} />
              <ExchangeRateForm baseCurrency={preference.baseCurrency} />
              <Card className="xl:col-span-2">
                <CardHeader>
                  <CardTitle>Stored exchange rates</CardTitle>
                  <CardDescription>
                    Latest rates used for base-currency portfolio totals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No conversion rates yet. Same-currency assets still calculate normally.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {rates.map((rate) => (
                        <div
                          key={rate.id}
                          className="flex min-w-0 items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2.5 text-sm"
                        >
                          <span className="truncate font-medium">
                            {rate.baseCurrency} / {rate.quoteCurrency}
                          </span>
                          <Badge variant="secondary" className="shrink-0 font-mono font-normal">
                            {rate.rate.toLocaleString("en", { maximumFractionDigits: 6 })}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          }
          planning={
            <FireSettingsCard settings={fireSettings} baseCurrency={preference.baseCurrency} />
          }
          dataAndSecurity={
            <>
              <GoogleDriveArchiveCard summary={driveSummary} />
              <DataControls />
              <SecurityForm />
              <div className="xl:col-span-2">
                <DeleteAccountCard />
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
