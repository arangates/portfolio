import { FireArchiveButton } from "@/components/fire-archive-button";
import { FireRecordDialog } from "@/components/fire-record-dialog";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@portfolio/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@portfolio/ui/components/card";

type Settings = {
  profile: {
    birthDate: string | null;
    plannedRetirementYear: number;
    planEndAge: number;
    inflationRate: number;
    expectedReturnRate: number;
    returnVolatility: number;
    safeWithdrawalRate: number;
    safetyBuffer: number;
    annualSavings: number;
    savingsCurrency: string;
    targetLegacy: number;
    spendingPolicy: string;
  } | null;
  family: Array<{
    id: string;
    name: string;
    relationship: string;
    birthDate: string | null;
    linkedToPortfolio: boolean;
    netWorth: number;
    investableAssets: number;
    annualNetIncome: number;
    currency: string;
    includedInPlan: boolean;
  }>;
};

export function FireSettingsCard({
  settings,
  baseCurrency,
}: {
  settings: Settings;
  baseCurrency: string;
}) {
  const members = settings.family.map((member) => ({
    id: member.id,
    name: member.name,
    relationship: member.relationship,
  }));
  const profileValues = settings.profile
    ? {
        birthDate: settings.profile.birthDate,
        plannedRetirementYear: settings.profile.plannedRetirementYear,
        planEndAge: settings.profile.planEndAge,
        inflationRate: settings.profile.inflationRate * 100,
        expectedReturnRate: settings.profile.expectedReturnRate * 100,
        returnVolatility: settings.profile.returnVolatility * 100,
        safeWithdrawalRate: settings.profile.safeWithdrawalRate * 100,
        safetyBuffer: settings.profile.safetyBuffer * 100,
        annualSavings: settings.profile.annualSavings,
        savingsCurrency: settings.profile.savingsCurrency,
        targetLegacy: settings.profile.targetLegacy,
        spendingPolicy: settings.profile.spendingPolicy,
      }
    : {
        plannedRetirementYear: new Date().getUTCFullYear() + 10,
        planEndAge: 95,
        inflationRate: 3,
        expectedReturnRate: 6,
        returnVolatility: 12,
        safeWithdrawalRate: 3.5,
        safetyBuffer: 15,
        annualSavings: 0,
        savingsCurrency: baseCurrency,
        targetLegacy: 0,
        spendingPolicy: "essential_floor",
      };

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Family & FIRE planning</CardTitle>
        <CardDescription>
          Manage household members and the assumptions used across every retirement scenario.
        </CardDescription>
        <div className="flex flex-wrap gap-2 pt-2">
          <FireRecordDialog
            kind="fire_profile"
            values={profileValues}
            members={members}
            defaultCurrency={baseCurrency}
            label={settings.profile ? "Edit FIRE assumptions" : "Create FIRE plan"}
          />
          <FireRecordDialog
            kind="family_member"
            values={{
              currency: baseCurrency,
              netWorth: 0,
              investableAssets: 0,
              annualNetIncome: 0,
              includedInPlan: true,
            }}
            members={members}
            defaultCurrency={baseCurrency}
          />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {settings.family.length === 0 ? (
          <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            No family members added. The portfolio still remains available as the account owner’s
            investable wealth after FIRE setup.
          </p>
        ) : (
          settings.family.map((member) => (
            <div key={member.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <Badge variant="outline" className="mt-1">
                    {member.relationship}
                  </Badge>
                </div>
                <div className="flex">
                  <FireRecordDialog
                    kind="family_member"
                    values={member}
                    members={members}
                    defaultCurrency={baseCurrency}
                    label="Edit"
                  />
                  <FireArchiveButton kind="family_member" id={member.id} label={member.name} />
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {member.linkedToPortfolio
                  ? "Linked to this Selvam portfolio"
                  : `${formatCurrency(member.investableAssets, member.currency)} investable`}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
