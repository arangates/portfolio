import { PageHeader } from "@/components/page-header";
import { SettingsTabs } from "@/components/settings-tabs";
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

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const [preference, rates, fireSettings] = await Promise.all([
    getPortfolioPreference(session.user.id),
    getLatestExchangeRates(session.user.id),
    getFireSettings(session.user.id),
  ]);
  return (
    <div className="@container/main mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 sm:py-5 md:gap-5 md:py-6">
        <PageHeader
          title="Settings"
          description="Manage your account, portfolio defaults, family planning and data security."
        />
        <SettingsTabs
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
