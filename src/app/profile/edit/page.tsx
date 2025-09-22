import { requireAuth, getUserProfile } from "@/lib/auth";
import { EditProfileClient } from "@/components/profile/edit-profile-client";
import { uploadProfileImage } from "@/lib/utils/image-upload";
import { updateUserProfileAction } from "@/lib/actions/user-actions";

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

  return (
    <EditProfileClient
      user={user}
      action={updateUserProfileAction}
      uploadAction={uploadProfileImageServerAction}
    />
  );
}
