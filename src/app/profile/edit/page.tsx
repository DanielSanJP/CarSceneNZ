import { requireAuth, getUserProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { EditProfileClient } from "@/components/profile/edit-profile-client";
import { uploadProfileImage } from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { User } from "@/types";

// Inline server functions from profile.ts
async function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    display_name?: string;
    profile_image_url?: string;
  }
): Promise<User | null> {
  try {
    const supabase = await createClient();

    // Prepare the update object
    const updateObject: {
      updated_at: string;
      username?: string;
      display_name?: string;
      profile_image_url?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (updates.username) {
      updateObject.username = updates.username;
    }
    if (updates.display_name !== undefined) {
      updateObject.display_name = updates.display_name;
    }
    if (updates.profile_image_url !== undefined) {
      updateObject.profile_image_url = updates.profile_image_url;
    }

    const { data: profileData, error } = await supabase
      .from("users")
      .update(updateObject)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      if (error.code === "23505") {
        // Unique constraint violation (likely username)
        throw new Error("Username is already taken");
      }
      throw new Error("Failed to update profile");
    }

    if (!profileData) {
      throw new Error("No data returned from update");
    }

    return {
      id: profileData.id,
      username: profileData.username,
      display_name: profileData.display_name || profileData.username,
      email: "",
      profile_image_url: profileData.profile_image_url,
      created_at: profileData.created_at,
      updated_at: profileData.updated_at,
    };
  } catch (error) {
    console.error("Error updating user profile:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update profile");
  }
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

async function updateProfileAction(formData: FormData) {
  "use server";

  try {
    const authUser = await requireAuth();
    const user = await getUserProfile(authUser.id);

    if (!user) {
      return { success: false, error: "Failed to load user profile" };
    }

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
  const authUser = await requireAuth();
  const user = await getUserProfile(authUser.id);

  if (!user) {
    throw new Error("Failed to load user profile");
  }

  return (
    <EditProfileClient
      user={user}
      action={updateProfileAction}
      uploadAction={uploadProfileImageServerAction}
    />
  );
}
