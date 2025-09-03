import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/dal";
import { EditProfileClient } from "@/components/profile/edit-profile-client";

export default async function EditProfilePage() {
  // Require authentication on the server
  const user = await requireAuth();

  // If no user, redirect to login
  if (!user) {
    redirect("/login");
  }

  return <EditProfileClient user={user} />;
}
