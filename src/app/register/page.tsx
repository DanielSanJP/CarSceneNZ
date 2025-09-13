import { RegisterForm } from "@/components/register-form";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/server";

async function checkUsernameAvailability(username: string) {
  "use server";

  const supabase = await createClient();

  if (!username || username.trim().length === 0) {
    return { available: false, message: "Username is required" };
  }

  if (username.length < 3) {
    return {
      available: false,
      message: "Username must be at least 3 characters",
    };
  }

  if (username.length > 20) {
    return {
      available: false,
      message: "Username must be less than 20 characters",
    };
  }

  // Check for valid characters (alphanumeric and underscores only)
  const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!validUsernameRegex.test(username)) {
    return {
      available: false,
      message: "Username can only contain letters, numbers, and underscores",
    };
  }

  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("username", username.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" which means username is available
    return {
      available: false,
      message: "Error checking username availability",
    };
  }

  const available = !data;
  return {
    available,
    message: available ? "Username is available" : "Username is already taken",
  };
}

async function checkEmailAvailability(email: string) {
  "use server";

  if (!email || email.trim().length === 0) {
    return { available: false, message: "Email is required" };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { available: false, message: "Please enter a valid email address" };
  }

  try {
    const supabase = await createClient();

    // Check if email exists in our users table (which syncs with auth.users)
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (error) {
      // If error is "Row not found", email is available
      if (error.code === "PGRST116") {
        return {
          available: true,
          message: "Email is available",
        };
      }

      console.error("Error checking email availability:", error);
      return {
        available: true,
        message: "Could not verify email availability, but you can proceed",
      };
    }

    // If we found a user with this email, it's not available
    if (data) {
      return {
        available: false,
        message: "Email is already in use",
      };
    }

    // If no data and no error, email is available (shouldn't happen, but just in case)
    return {
      available: true,
      message: "Email is available",
    };
  } catch (error) {
    console.error("Error checking email availability:", error);
    return {
      available: true,
      message: "Could not verify email availability, but you can proceed",
    };
  }
}

async function signupAction(formData: FormData) {
  "use server";

  const supabase = await createClient();

  // Validate required fields
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const displayName = formData.get("displayName") as string;
  // Note: Profile image upload will be handled after email confirmation

  if (!email || !password || !username || !displayName) {
    throw new Error("All fields are required");
  }

  // For now, we'll handle profile image upload after user creation
  // The trigger will create the profile, and we can update the image later
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        display_name: displayName,
        // Note: profile image will be handled after email confirmation
      },
    },
  });

  if (error) {
    throw new Error(error.message || "Registration failed");
  }

  // The database trigger will automatically create the user profile
  // Profile image upload can be handled after email confirmation

  revalidatePath("/", "layout");
  redirect("/");
}

function RegisterContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegisterForm
          action={signupAction}
          checkUsernameAvailability={checkUsernameAvailability}
          checkEmailAvailability={checkEmailAvailability}
        />
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
        <RegisterContent />
      </Suspense>
    </div>
  );
}
