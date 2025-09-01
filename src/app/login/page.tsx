import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

function LoginContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
