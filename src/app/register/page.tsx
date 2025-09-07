import { RegisterForm } from "@/components/register-form";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/utils/supabase/server";
import { uploadProfileImage } from "@/lib/server/image-upload";

async function signupAction(formData: FormData) {
  "use server";

  const supabase = await createClient();

  // Validate required fields
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = formData.get("username") as string;
  const displayName = formData.get("displayName") as string;
  const profileImage = formData.get("profileImage") as File | null;

  if (!email || !password || !username || !displayName) {
    throw new Error("All fields are required");
  }

  const data = {
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  };

  const { data: authData, error } = await supabase.auth.signUp(data);
  if (error) {
    throw new Error(error.message || "Registration failed");
  }

  if (authData.user) {
    let profileImageUrl = null;

    // Upload profile image if provided
    if (profileImage && profileImage.size > 0) {
      try {
        const uploadedUrl = await uploadProfileImage(
          profileImage,
          authData.user.id
        );

        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      } catch {
        // Don't throw here - user creation should still succeed
      }
    }

    // Create user profile in the users table
    const userData = {
      id: authData.user.id,
      username: username,
      profile_image_url: profileImageUrl,
    };
    const { error: profileError } = await supabase
      .from("users")
      .insert(userData);

    if (profileError) {
      throw new Error("Failed to create user profile");
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

function RegisterContent() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegisterForm action={signupAction} />
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
