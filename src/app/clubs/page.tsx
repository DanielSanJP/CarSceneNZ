import { Suspense } from "react";
import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { ClubTabNavigation } from "@/components/clubs/club-tab-navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClub, getUserClubMemberships } from "@/lib/server/clubs";
import {
  moveClubImageFromTemp,
  deleteClubImage,
} from "@/lib/utils/upload-club-images";
import { getUser } from "@/lib/auth";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

async function createClubAction(formData: FormData) {
  "use server";

  console.log("=== Starting club creation server action (from clubs page) ===");

  const user = await getUser();
  console.log("User authenticated:", user?.id);

  // Extract form data
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const club_type = formData.get("club_type") as string;
  const banner_image = formData.get("banner_image") as string;
  const tempClubId = formData.get("tempClubId") as string;

  console.log("Form data received:", {
    name,
    description: description?.length,
    location,
    club_type,
    banner_image: banner_image ? "present" : "none",
    tempClubId: tempClubId || "none",
  });

  if (!name?.trim()) {
    console.error("Validation failed: Club name is required");
    throw new Error("Club name is required");
  }

  if (!description?.trim()) {
    console.error("Validation failed: Club description is required");
    throw new Error("Club description is required");
  }

  if (!location?.trim()) {
    console.error("Validation failed: Club location is required");
    throw new Error("Club location is required");
  }

  console.log("Validation passed");

  try {
    // Create the club with the user as the leader
    const clubData = {
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      club_type: club_type || "open",
      banner_image: banner_image || "",
      leader_id: user.id, // Ensure the creator is the leader
    };

    console.log("Calling createClub with data:", clubData);
    const result = await createClub(clubData);
    console.log(
      "createClub result:",
      result?.id ? `Success - ID: ${result.id}` : "Failed"
    );

    if (!result) {
      throw new Error("Failed to create club");
    }

    // If we have a temp image, move it to the final club folder
    if (tempClubId && banner_image) {
      console.log("Moving temp image from", tempClubId, "to", result.id);
      try {
        const newImageUrl = await moveClubImageFromTemp(tempClubId, result.id);
        if (newImageUrl) {
          console.log("Club image moved successfully:", newImageUrl);
        } else {
          console.log("No image URL returned from move operation");
        }
      } catch (error) {
        console.error("Error moving temp club image:", error);
        // Club was created but image failed to move - log but don't fail
      }
    } else {
      console.log(
        "No temp image to move - tempClubId:",
        tempClubId,
        "banner_image:",
        banner_image ? "present" : "none"
      );
    }

    console.log("Revalidating paths...");
    // Revalidate relevant paths
    revalidatePath("/clubs");
    revalidatePath("/clubs?tab=myclub");

    console.log("Redirecting to club:", result.id);
    // Redirect to the new club page
    redirect(`/clubs/${result.id}`);
  } catch (error) {
    console.error("=== Club creation failed ===", error);

    // If club creation failed and we have temp images, clean them up
    if (tempClubId) {
      console.log("Cleaning up temp images for:", tempClubId);
      try {
        await deleteClubImage(tempClubId);
      } catch (cleanupError) {
        console.error("Error cleaning up temp club images:", cleanupError);
      }
    }
    throw error;
  }
}

export default async function ClubsPage() {
  // Get user (optional)
  const currentUser = await getUserOptional();

  // Fetch user's club memberships if authenticated
  const userMemberships = currentUser
    ? await getUserClubMemberships(currentUser.id)
    : [];

  // Fetch clubs directly from database
  const supabase = await createClient();
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select(
      `
      *,
      users!clubs_leader_id_fkey (
        id,
        username,
        display_name,
        profile_image_url
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clubs:", error);
  }

  // Transform data to match expected format
  const transformedClubs = (clubs || []).map((club) => ({
    id: club.id,
    name: club.name,
    description: club.description,
    banner_image_url: club.banner_image_url,
    club_type: club.club_type,
    location: club.location,
    leader_id: club.leader_id,
    total_likes: club.total_likes || 0,
    created_at: club.created_at,
    updated_at: club.updated_at,
    leader: {
      id: club.users.id,
      username: club.users.username,
      display_name: club.users.display_name || club.users.username,
      profile_image_url: club.users.profile_image_url,
    },
  }));

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Car Clubs</h1>
                <p className="text-muted-foreground mb-6">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ClubTabNavigation
        clubs={transformedClubs}
        currentUser={
          currentUser
            ? {
                ...currentUser,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : null
        }
        userMemberships={userMemberships}
        createClubAction={createClubAction}
      />
    </Suspense>
  );
}
