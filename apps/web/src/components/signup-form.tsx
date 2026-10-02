"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@portfolio/ui/components/button";
import { Card, CardContent } from "@portfolio/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@portfolio/ui/components/field";
import { Input } from "@portfolio/ui/components/input";
import { Spinner } from "@portfolio/ui/components/spinner";
import { cn } from "@portfolio/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

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
  className,
  googleEnabled,
  oauthFailed = false,
  ...props
}: React.ComponentProps<"div"> & { googleEnabled: boolean; oauthFailed?: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            ref={formRef}
            noValidate
            className="p-6 md:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Start a private portfolio workspace owned by you.
                </p>
              </div>
              {oauthFailed ? (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  Google sign-up was not completed. Please try again.
                </div>
              ) : null}
              {googleEnabled ? (
                <>
                  <GoogleSignInButton errorCallbackURL="/signup?oauth=failed" />
                  <div className="relative text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="relative z-10 bg-card px-2 text-muted-foreground">
                      Or create an account with email
                    </span>
                  </div>
                </>
              ) : null}
              <form.Field name="name">
                {(field) => (
                  <Field data-invalid={field.state.meta.errors.length > 0}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      autoComplete="name"
                      placeholder="Your name"
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
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                      aria-describedby={
                        field.state.meta.errors.length ? "signup-email-error" : undefined
                      }
                      required
                    />
                    <FieldDescription>
                      Used only for authentication and account communication.
                    </FieldDescription>
                    <FieldError id="signup-email-error" role={undefined}>
                      {field.state.meta.errors
                        .map((error) => error?.message)
                        .filter(Boolean)
                        .join(", ")}
                    </FieldError>
                  </Field>
                )}
              </form.Field>
              <Field className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="password">
                  {(field) => (
                    <Field data-invalid={field.state.meta.errors.length > 0}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        autoComplete="new-password"
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
                      <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        autoComplete="new-password"
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
              </Field>
              <FieldDescription>Password must contain at least 12 characters.</FieldDescription>
              <Field>
                <form.Subscribe selector={(state) => state.isSubmitting}>
                  {(isSubmitting) => (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                      {isSubmitting ? "Creating account…" : "Create account"}
                    </Button>
                  )}
                </form.Subscribe>
              </Field>
              <FieldDescription className="text-center">
                Already have an account? <Link href="/login">Sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/auth-portfolio.svg"
              alt="Portfolio analytics illustration"
              fill
              priority
              sizes="(min-width: 768px) 448px, 0px"
              className="object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-foreground/80">
        Every portfolio record is isolated to your account.
      </FieldDescription>
    </div>
  );
}
