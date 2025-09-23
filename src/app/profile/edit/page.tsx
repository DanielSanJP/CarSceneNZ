import { requireAuth, getUserProfile } from "@/lib/auth";
import { EditProfileClient } from "@/components/profile/edit-profile-client";
import { uploadProfileImage } from "@/lib/utils/image-upload";
import { updateUserProfileAction } from "@/lib/actions/user-actions";
import { createClient } from "@/lib/utils/supabase/server";

async function checkUsernameAvailability(
  currentUsername: string,
  username: string
) {
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

  // If it's the same as the current username, it's available
  if (username.toLowerCase() === currentUsername.toLowerCase()) {
    return {
      available: true,
      message: "This is your current username",
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

async function uploadProfileImageServerAction(formData: FormData) {
  "use server";

  try {
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return { url: null, error: "Missing file or user ID" };
    }

    const url = await uploadProfileImage(file, userId);
    return { url, error: null };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export default async function EditProfilePage() {
  // Require authentication on the server
  const authUser = await requireAuth();
  const user = await getUserProfile(authUser.id);

  if (!user) {
    throw new Error("Failed to load user profile");
  }

  // Create bound function to avoid inline function in JSX
  const boundCheckUsernameAvailability = checkUsernameAvailability.bind(
    null,
    user.username
  );

  return (
    <EditProfileClient
      user={user}
      action={updateUserProfileAction}
      uploadAction={uploadProfileImageServerAction}
      checkUsernameAvailability={boundCheckUsernameAvailability}
    />
  );
}
