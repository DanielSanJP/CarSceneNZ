import { getUser } from "@/lib/auth";
import { EditProfileClient } from "@/components/profile/edit-profile-client";

export default async function EditProfilePage() {
  // Require authentication on the server
  const user = await getUser();

  return <EditProfileClient user={user} />;
}
