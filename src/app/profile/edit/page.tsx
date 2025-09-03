import { getUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/server/profile";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EditProfileClient } from "@/components/profile/edit-profile-client";

async function updateProfileAction(formData: FormData) {
  "use server";

  const user = await getUser();

  // Extract form data
  const username = formData.get("username") as string;
  const display_name = formData.get("display_name") as string;
  const profile_image_url = formData.get("profile_image_url") as string;

  if (!username?.trim()) {
    throw new Error("Username is required");
  }

  const updates = {
    username: username.trim(),
    display_name: display_name?.trim() || undefined,
    profile_image_url: profile_image_url || undefined,
  };

  const result = await updateUserProfile(user.id, updates);

  if (!result) {
    throw new Error("Failed to update profile");
  }

  revalidatePath("/profile/edit");
  revalidatePath(`/profile/${result.id}`);
  redirect(`/profile/${result.id}`);
}

export default async function EditProfilePage() {
  // Require authentication on the server
  const user = await getUser();

  return <EditProfileClient user={user} action={updateProfileAction} />;
}
