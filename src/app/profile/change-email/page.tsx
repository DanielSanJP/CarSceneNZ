import { ChangeEmailForm } from "@/components/auth/change-email-form";
import { getUser } from "@/lib/auth";
import { Suspense } from "react";

export const metadata = {
  title: "Change Email | CarSceneNZ",
  description: "Change your email address for your CarSceneNZ account.",
};

async function ChangeEmailContent() {
  const user = await getUser(); // This will redirect if not authenticated

  // Ensure user has an email address
  if (!user.email) {
    throw new Error("User email is required to change email address");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Change Email Address</h1>
          <p className="text-muted-foreground">
            Update the email address associated with your account. You&apos;ll
            need to verify your new email address.
          </p>
        </div>
        <ChangeEmailForm currentEmail={user.email} />
      </div>
    </div>
  );
}

export default function ChangeEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChangeEmailContent />
    </Suspense>
  );
}
