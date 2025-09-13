import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Email Confirmed | CarSceneNZ",
  description: "Your email address has been successfully updated.",
};

function EmailConfirmedContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Email Address Updated!</CardTitle>
            <CardDescription>
              Your email address has been successfully updated. You can now use
              your new email to log in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  What&apos;s next?
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
                  <li>Your account now uses the new email address</li>
                  <li>Use your new email for future logins</li>
                  <li>Your profile has been automatically updated</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/profile/edit">Go to profile</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to home
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailConfirmedContent />
    </Suspense>
  );
}
