"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@portfolio/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@portfolio/ui/components/field";
import { Input } from "@portfolio/ui/components/input";
import { Spinner } from "@portfolio/ui/components/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

import {
  AuthScreen,
  authInputClass,
  authPrimaryButtonClass,
  authSecondaryButtonClass,
} from "@/components/auth-screen";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { authClient } from "@/lib/auth-client";

export function LoginForm({
  googleEnabled,
  oauthFailed = false,
}: {
  googleEnabled: boolean;
  oauthFailed?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [emailMode, setEmailMode] = useState(!googleEnabled);
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address"),
        password: z.string().min(1, "Enter your password"),
      }),
    },
    onSubmitInvalid: () => {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { ...value, rememberMe: true },
        {
          onSuccess: () => {
            toast.success("Welcome back");
            router.replace("/dashboard");
            router.refresh();
          },
          onError: ({ error }) => {
            toast.error(error.message || "Unable to sign in");
          },
        },
      );
    },
  });

  return (
    <AuthScreen
      title="Log in to Selvam"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-white/90 hover:text-white">
            Sign up
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        {oauthFailed ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-sm text-red-200"
          >
            Google sign-in was not completed. Please try again.
          </div>
        ) : null}
        {!emailMode ? (
          <>
            <GoogleSignInButton label="Continue with Google" />
            <Button
              type="button"
              variant="secondary"
              className={authSecondaryButtonClass}
              onClick={() => setEmailMode(true)}
            >
              Continue with email
            </Button>
          </>
        ) : (
          <>
            {googleEnabled ? (
              <button
                type="button"
                className="mb-1 text-sm text-white/55 transition-colors hover:text-white"
                onClick={() => setEmailMode(false)}
              >
                ← All sign-in options
              </button>
            ) : null}
            <form
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                form.handleSubmit();
              }}
            >
              <FieldGroup className="gap-4">
                <form.Field name="email">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor={field.name} className="text-white/75">
                        Email
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={authInputClass}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        aria-invalid={field.state.meta.errors.length > 0}
                        aria-describedby={
                          field.state.meta.errors.length ? "login-email-error" : undefined
                        }
                        required
                      />
                      <FieldError id="login-email-error" role={undefined}>
                        {field.state.meta.errors
                          .map((error) => error?.message)
                          .filter(Boolean)
                          .join(", ")}
                      </FieldError>
                    </Field>
                  )}
                </form.Field>
                <form.Field name="password">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor={field.name} className="text-white/75">
                        Password
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        autoComplete="current-password"
                        className={authInputClass}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        aria-invalid={field.state.meta.errors.length > 0}
                        aria-describedby={
                          field.state.meta.errors.length ? "login-password-error" : undefined
                        }
                        required
                      />
                      <FieldError id="login-password-error" role={undefined}>
                        {field.state.meta.errors
                          .map((error) => error?.message)
                          .filter(Boolean)
                          .join(", ")}
                      </FieldError>
                    </Field>
                  )}
                </form.Field>
                <Field>
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        className={authPrimaryButtonClass}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                        {isSubmitting ? "Logging in…" : "Log in"}
                      </Button>
                    )}
                  </form.Subscribe>
                </Field>
              </FieldGroup>
            </form>
          </>
        )}
      </div>
    </AuthScreen>
  );
}
