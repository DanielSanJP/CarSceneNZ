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

interface LoginFormProps extends React.ComponentProps<"div"> {
  action: (formData: FormData) => Promise<void>;
}

export function LoginForm({ className, action, ...props }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleAction = async (formData: FormData) => {
    setIsLoading(true);
    setError("");

    try {
      await action(formData);
      // If we reach here, the action completed successfully
      // The redirect will happen automatically
    } catch (error) {
      console.error("Login error:", error);

      // Check if this is a redirect error (which is expected for successful login)
      if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
        // This is a successful redirect, don't show as error
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email and password below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleAction}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/register" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
