import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Suspense } from "react";

export const metadata = {
  title: "Forgot Password | CarSceneNZ",
  description:
    "Reset your password to regain access to your CarSceneNZ account.",
};

function ForgotPasswordContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
