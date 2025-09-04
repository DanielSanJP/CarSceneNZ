import { getUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/server/profile";
import { revalidatePath } from "next/cache";
import { EditProfileClient } from "@/components/profile/edit-profile-client";

async function updateProfileAction(formData: FormData) {
  "use server";

  try {
    const user = await getUser();

    // Extract form data
    const username = formData.get("username") as string;
    const display_name = formData.get("display_name") as string;
    const profile_image_url = formData.get("profile_image_url") as string;

    if (!username?.trim()) {
      return { success: false, error: "Username is required" };
    }

    const updates = {
      username: username.trim(),
      display_name: display_name?.trim() || undefined,
      profile_image_url: profile_image_url || undefined,
    };

    console.log("Server action - updating profile with:", updates);

    let result;
    try {
      result = await updateUserProfile(user.id, updates);
    } catch (updateError) {
      if (updateError instanceof Error) {
        return { success: false, error: updateError.message };
      }
      return { success: false, error: "Failed to update profile" };
    }

    if (!result) {
      return { success: false, error: "Failed to update profile" };
    }

    console.log("Server action - update successful:", result);

    // Revalidate specific paths
    revalidatePath("/profile/edit");
    revalidatePath(`/profile/${result.id}`);
    revalidatePath(`/profile/${result.username}`);
    revalidatePath("/"); // Home page navigation

    // Return success with user data for client-side navigation
    return {
      success: true,
      user: result,
    };
  } catch (error) {
    console.error("Error in updateProfileAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export default async function EditProfilePage() {
  // Require authentication on the server
  const user = await getUser();

  return <EditProfileClient user={user} action={updateProfileAction} />;
}
