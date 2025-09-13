import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/utils/supabase/server";

async function loginAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  "use server";

  const supabase = await createClient();

  // Validate input
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login error:", error);

    // Provide user-friendly error messages
    let errorMessage = "Incorrect username or password.";

    if (error.message === "Invalid login credentials") {
      errorMessage = "Incorrect username or password.";
    } else if (error.message.includes("Email not confirmed")) {
      errorMessage =
        "Please check your email and confirm your account before logging in.";
    } else if (error.message.includes("Too many requests")) {
      errorMessage =
        "Too many login attempts. Please wait a moment before trying again.";
    } else if (error.message.includes("Invalid email")) {
      errorMessage = "Please enter a valid email address.";
    } else {
      // For any other errors, show generic message
      errorMessage = "Unable to sign in. Please try again.";
    }

    return { success: false, error: errorMessage };
  }

  // Revalidate the cache but don't redirect here
  revalidatePath("/", "layout");

  return { success: true };
}

function LoginContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center">
      <div className="w-full max-w-sm">
        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center">
          <div className="w-full max-w-sm text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
