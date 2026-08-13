"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@zerodha-coin/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@zerodha-coin/ui/components/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zerodha-coin/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@zerodha-coin/ui/components/field";
import { Input } from "@zerodha-coin/ui/components/input";
import { Spinner } from "@zerodha-coin/ui/components/spinner";
import { DownloadIcon, SaveIcon, ShieldCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

async function saveRecord(kind: string, data: Record<string, unknown>) {
  const response = await fetch("/api/portfolio/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, data }),
  });
  const body = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Could not save settings");
}

export function PreferenceForm({
  preference,
}: {
  preference: { baseCurrency: string; locale: string; timeZone: string };
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await saveRecord("preference", Object.fromEntries(new FormData(event.currentTarget)));
      toast.success("Portfolio preferences updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio preferences</CardTitle>
        <CardDescription>Choose how multi-currency values are presented.</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="baseCurrency">Base currency</FieldLabel>
              <Input
                id="baseCurrency"
                name="baseCurrency"
                defaultValue={preference.baseCurrency}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="locale">Locale</FieldLabel>
              <Input id="locale" name="locale" defaultValue={preference.locale} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="timeZone">Time zone</FieldLabel>
              <Input id="timeZone" name="timeZone" defaultValue={preference.timeZone} required />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            Save preferences
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function ExchangeRateForm({ baseCurrency }: { baseCurrency: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await saveRecord("exchange_rate", Object.fromEntries(new FormData(event.currentTarget)));
      toast.success("Exchange rate added");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save exchange rate");
    } finally {
      setPending(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exchange rates</CardTitle>
        <CardDescription>
          Store dated conversion rates instead of relying on a hardcoded or external live rate.
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="rate-base">Base currency</FieldLabel>
              <Input id="rate-base" name="baseCurrency" defaultValue={baseCurrency} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="quoteCurrency">Asset currency</FieldLabel>
              <Input id="quoteCurrency" name="quoteCurrency" placeholder="EUR" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="rate">
                {baseCurrency} value of one asset-currency unit
              </FieldLabel>
              <Input id="rate" name="rate" type="number" min="0" step="any" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="rate-as-of">Rate date</FieldLabel>
              <Input id="rate-as-of" name="asOf" type="date" required />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            Add rate
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function AccountForm({ name, email }: { name: string; email: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await authClient.updateUser({ name: String(data.name) });
      toast.success("Account profile updated");
      router.refresh();
    } catch {
      toast.error("Could not update account profile");
    } finally {
      setPending(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account profile</CardTitle>
        <CardDescription>Your authentication identity and private workspace owner.</CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="profile-name">Name</FieldLabel>
              <Input id="profile-name" name="name" defaultValue={name} required />
            </Field>
            <Field data-disabled>
              <FieldLabel htmlFor="profile-email">Email</FieldLabel>
              <Input id="profile-email" value={email} disabled />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            Save profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function DataControls() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data portability</CardTitle>
        <CardDescription>
          Download a machine-readable copy of all portfolio records owned by your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-start gap-3 text-sm text-muted-foreground">
        <ShieldCheckIcon />
        <p>
          The export is generated after a fresh server-side session check and is never publicly
          cached.
        </p>
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          render={<a href="/api/portfolio/export" download />}
          nativeButton={false}
        >
          <DownloadIcon data-icon="inline-start" />
          Download JSON export
        </Button>
      </CardFooter>
    </Card>
  );
}

export function SecurityForm() {
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const result = await authClient.changePassword({
        currentPassword: String(data.currentPassword),
        newPassword: String(data.newPassword),
        revokeOtherSessions: true,
      });
      if (result.error) throw new Error(result.error.message);
      toast.success("Password changed and other sessions revoked");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password");
    } finally {
      setPending(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Change your password and sign out every other active session.
        </CardDescription>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="newPassword">New password</FieldLabel>
              <Input id="newPassword" name="newPassword" type="password" minLength={12} required />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <SaveIcon data-icon="inline-start" />}
            Change password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function DeleteAccountCard() {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function deleteAccount() {
    setPending(true);
    try {
      const result = await authClient.deleteUser({ password });
      if (result.error) throw new Error(result.error.message);
      toast.success("Account and portfolio data deleted");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account");
      setPending(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>
          Permanently delete your identity and all portfolio data through database cascades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="delete-password">Confirm with password</FieldLabel>
          <Input
            id="delete-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant="destructive" disabled={!password || pending} />}
          >
            Delete my account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. All imports, positions, ledgers, accounts, snapshots and
                preferences owned by this account will be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={deleteAccount} disabled={pending}>
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
