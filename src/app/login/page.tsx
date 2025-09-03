import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/server";

async function loginAction(formData: FormData) {
  "use server";

  const supabase = await createClient();

  // Validate input
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error);
    throw new Error(error.message || "Login failed");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

function LoginContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm action={loginAction} />
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
