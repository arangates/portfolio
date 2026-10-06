"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@portfolio/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@portfolio/ui/components/field";
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

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Enter the same password in both fields",
    path: ["confirmPassword"],
  });

export function SignupForm({
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
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    validators: { onSubmit: signupSchema },
    onSubmitInvalid: () => {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        { name: value.name.trim(), email: value.email, password: value.password },
        {
          onSuccess: () => {
            toast.success("Your account is ready");
            router.replace("/dashboard");
            router.refresh();
          },
          onError: ({ error }) => {
            toast.error(error.message || "Unable to create account");
          },
        },
      );
    },
  });

  return (
    <AuthScreen
      title="Create your workspace"
      note="Your portfolio data stays private to your Selvam account."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-white/90 hover:text-white">
            Log in
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
            Google sign-up was not completed. Please try again.
          </div>
        ) : null}
        {!emailMode ? (
          <>
            <GoogleSignInButton errorCallbackURL="/signup?oauth=failed" />
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
                ← All sign-up options
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
                <form.Field name="name">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor={field.name} className="text-white/75">
                        Name
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        autoComplete="name"
                        placeholder="Your name"
                        className={authInputClass}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                        aria-invalid={field.state.meta.errors.length > 0}
                        aria-describedby={
                          field.state.meta.errors.length ? "signup-name-error" : undefined
                        }
                        required
                      />
                      <FieldError id="signup-name-error" role={undefined}>
                        {field.state.meta.errors
                          .map((error) => error?.message)
                          .filter(Boolean)
                          .join(", ")}
                      </FieldError>
                    </Field>
                  )}
                </form.Field>
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
                          field.state.meta.errors.length ? "signup-email-error" : undefined
                        }
                        required
                      />
                      <FieldError id="signup-email-error" role={undefined}>
                        {field.state.meta.errors
                          .map((error) => error?.message)
                          .filter(Boolean)
                          .join(", ")}
                      </FieldError>
                    </Field>
                  )}
                </form.Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          autoComplete="new-password"
                          className={authInputClass}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          aria-invalid={field.state.meta.errors.length > 0}
                          aria-describedby={
                            field.state.meta.errors.length ? "signup-password-error" : undefined
                          }
                          minLength={12}
                          required
                        />
                        <FieldError id="signup-password-error" role={undefined}>
                          {field.state.meta.errors
                            .map((error) => error?.message)
                            .filter(Boolean)
                            .join(", ")}
                        </FieldError>
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="confirmPassword">
                    {(field) => (
                      <Field data-invalid={field.state.meta.errors.length > 0}>
                        <FieldLabel htmlFor={field.name} className="text-white/75">
                          Confirm password
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          autoComplete="new-password"
                          className={authInputClass}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => field.handleChange(event.target.value)}
                          aria-invalid={field.state.meta.errors.length > 0}
                          aria-describedby={
                            field.state.meta.errors.length
                              ? "signup-confirm-password-error"
                              : undefined
                          }
                          required
                        />
                        <FieldError id="signup-confirm-password-error" role={undefined}>
                          {field.state.meta.errors
                            .map((error) => error?.message)
                            .filter(Boolean)
                            .join(", ")}
                        </FieldError>
                      </Field>
                    )}
                  </form.Field>
                </div>
                <FieldDescription className="text-white/45">
                  Password must contain at least 12 characters.
                </FieldDescription>
                <Field>
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <Button
                        type="submit"
                        className={authPrimaryButtonClass}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                        {isSubmitting ? "Creating account…" : "Create account"}
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
