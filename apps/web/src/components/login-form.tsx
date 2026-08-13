"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@zerodha-coin/ui/components/button";
import { Card, CardContent } from "@zerodha-coin/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@zerodha-coin/ui/components/field";
import { Input } from "@zerodha-coin/ui/components/input";
import { Spinner } from "@zerodha-coin/ui/components/spinner";
import { cn } from "@zerodha-coin/ui/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address"),
        password: z.string().min(1, "Enter your password"),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(value, {
        onSuccess: () => {
          toast.success("Welcome back");
          router.replace("/dashboard");
          router.refresh();
        },
        onError: ({ error }) => {
          toast.error(error.message || "Unable to sign in");
        },
      });
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="p-6 md:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Sign in to your private Aranga portfolio.
                </p>
              </div>
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
                      required
                    />
                    <FieldError>
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
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      aria-invalid={field.state.meta.errors.length > 0}
                      required
                    />
                    <FieldError>
                      {field.state.meta.errors
                        .map((error) => error?.message)
                        .filter(Boolean)
                        .join(", ")}
                    </FieldError>
                  </Field>
                )}
              </form.Field>
              <Field>
                <form.Subscribe
                  selector={(state) => ({
                    canSubmit: state.canSubmit,
                    isSubmitting: state.isSubmitting,
                  })}
                >
                  {({ canSubmit, isSubmitting }) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
                      {isSubmitting ? "Signing in…" : "Sign in"}
                    </Button>
                  )}
                </form.Subscribe>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account? <Link href="/signup">Create one</Link>
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
      <FieldDescription className="px-6 text-center">
        Your portfolio data is private and isolated to your account.
      </FieldDescription>
    </div>
  );
}
