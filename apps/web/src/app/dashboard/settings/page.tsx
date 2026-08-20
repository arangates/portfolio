import { PageHeader } from "@/components/page-header";
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
          title="Settings & data"
          description="Manage your account profile, portfolio presentation, stored FX assumptions and private data export."
        />
        <div className="grid gap-4 px-4 xl:grid-cols-2 lg:px-6">
          <AccountForm name={session.user.name} email={session.user.email} />
          <PreferenceForm preference={preference} />
          <FireSettingsCard settings={fireSettings} baseCurrency={preference.baseCurrency} />
          <ExchangeRateForm baseCurrency={preference.baseCurrency} />
          <Card>
            <CardHeader>
              <CardTitle>Latest stored rates</CardTitle>
              <CardDescription>Rates used to calculate base-currency totals.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {rates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No conversion rates stored. Same-currency assets still calculate normally.
                </p>
              ) : (
                rates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between gap-4 text-sm">
                    <span>
                      {rate.baseCurrency} / {rate.quoteCurrency}
                    </span>
                    <Badge variant="outline">
                      {rate.rate.toLocaleString("en", { maximumFractionDigits: 6 })}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <DataControls />
          <SecurityForm />
          <DeleteAccountCard />
        </div>
      </div>
    </div>
  );
}
