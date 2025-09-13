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

    // Provide user-friendly error messages
    let errorMessage = "Login failed";

    if (error.message === "Invalid login credentials") {
      errorMessage =
        "Invalid email or password. Please check your credentials and try again.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage =
        "Please check your email and click the confirmation link before logging in.";
    } else if (error.message.includes("Too many requests")) {
      errorMessage =
        "Too many login attempts. Please wait a moment before trying again.";
    } else if (error.message.includes("Invalid email")) {
      errorMessage = "Please enter a valid email address.";
    } else {
      // For any other errors, show the original message but make it more user-friendly
      errorMessage = error.message || "Login failed. Please try again.";
    }

    throw new Error(errorMessage);
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
