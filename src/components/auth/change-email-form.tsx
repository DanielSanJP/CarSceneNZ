"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { createClient } from "@/lib/utils/supabase/client";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ChangeEmailFormProps extends React.ComponentProps<"div"> {
  currentEmail: string;
}

export function ChangeEmailForm({
  className,
  currentEmail,
  ...props
}: ChangeEmailFormProps) {
  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!newEmail) {
      setError("New email is required");
      setIsLoading(false);
      return;
    }

    if (newEmail === currentEmail) {
      setError("New email must be different from current email");
      setIsLoading(false);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser(
        {
          email: newEmail,
        },
        {
          emailRedirectTo: `${window.location.origin}/profile/email-confirmed`,
        }
      );

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Email change error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Verification Email Sent</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification email to{" "}
              <strong>{newEmail}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Check your new email inbox for a verification email</li>
                  <li>Click the verification link in the email</li>
                  <li>Your email address will be updated once verified</li>
                </ol>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                If you don&apos;t see the email in your inbox, check your spam
                folder. The verification link will expire in 24 hours.
              </p>
              <div className="flex justify-center">
                <Button variant="outline" asChild>
                  <Link href="/profile/edit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to profile
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Change Email Address</CardTitle>
          <CardDescription>
            Enter your new email address. You&apos;ll need to verify it before
            the change takes effect.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="currentEmail">Current Email</Label>
                <Input
                  id="currentEmail"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  name="newEmail"
                  type="email"
                  placeholder="your.new.email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Important
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          You&apos;ll receive a verification email at your new
                          address
                        </li>
                        <li>
                          Your email won&apos;t change until you verify it
                        </li>
                        <li>
                          You can still use your current email to log in until
                          verification
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading
                    ? "Sending verification..."
                    : "Send verification email"}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              <Link
                href="/profile/edit"
                className="underline underline-offset-4"
              >
                Cancel and go back
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
