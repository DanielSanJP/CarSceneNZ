import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateClubForm } from "@/components/clubs/create-club-form";
import { createClub } from "@/lib/server/clubs";

async function createClubAction(formData: FormData) {
  "use server";

  const user = await getUser();

  // Extract form data
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const club_type = formData.get("club_type") as string;
  const banner_image = formData.get("banner_image") as string;

  if (!name?.trim()) {
    throw new Error("Club name is required");
  }

  if (!description?.trim()) {
    throw new Error("Club description is required");
  }

  if (!location?.trim()) {
    throw new Error("Club location is required");
  }

  // Create the club
  const clubData = {
    name: name.trim(),
    description: description.trim(),
    location: location.trim(),
    club_type: club_type || "open",
    banner_image: banner_image || "",
    leader_id: user.id,
  };

  const result = await createClub(clubData);

  if (!result) {
    throw new Error("Failed to create club");
  }

  // Revalidate relevant paths
  revalidatePath("/clubs");
  revalidatePath("/clubs?tab=myclub");

  // Redirect to the new club page
  redirect(`/clubs/${result.id}`);
}

export default async function CreateClubPage() {
  // Get authenticated user
  const user = await getUser();

  return <CreateClubForm user={user} action={createClubAction} />;
}
