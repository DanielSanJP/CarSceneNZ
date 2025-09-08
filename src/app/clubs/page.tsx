import { Suspense } from "react";
import { getUserOptional } from "@/lib/auth";
import { ClubTabNavigation } from "@/components/clubs/club-tab-navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClub,
  getUserClubMemberships,
  getAllClubsWithStats,
  getClubsCount,
} from "@/lib/server/clubs";
// import {
//   moveClubImageFromTemp,
//   deleteClubImage,
// } from "@/lib/utils/image-upload"; // TODO: Convert to server action
import { getUser } from "@/lib/auth";
import { uploadClubImage } from "@/lib/server/image-upload";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

// Cache club data for 1 minute since it changes frequently with member actions
export const revalidate = 60;

async function uploadClubImageServerAction(formData: FormData) {
  "use server";

  try {
    const file = formData.get("file") as File;
    const clubId = formData.get("clubId") as string;
    const isTemp = formData.get("isTemp") === "true";

    if (!file || !clubId) {
      return { url: null, error: "Missing file or club ID" };
    }

    const url = await uploadClubImage(file, clubId, isTemp);
    return { url, error: null };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Server action wrapper for joining a club
async function joinClubAction(
  clubId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  "use server";
  const { joinClub } = await import("@/lib/server/clubs");
  return await joinClub(clubId, userId);
}

// Server action wrapper for sending club join request
async function sendClubJoinRequestAction(
  clubId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  "use server";
  const { sendClubJoinRequest } = await import("@/lib/server/inbox");
  return await sendClubJoinRequest(clubId, message);
}

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
        // TODO: Convert to server action
        // const newImageUrl = await moveClubImageFromTemp(tempClubId, result.id);
        const newImageUrl = null; // Temporary - disabled until converted
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
        // TODO: Convert to server action
        // await deleteClubImage(tempClubId);
      } catch (cleanupError) {
        console.error("Error cleaning up temp club images:", cleanupError);
      }
    }
    throw error;
  }
}

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Parse search parameters first
  const params = await searchParams;
  const tab = params.tab;

  // Get user (optional)
  const currentUser = await getUserOptional();

  // Early return for guest users trying to access myclub
  if (tab === "myclub" && !currentUser) {
    redirect("/clubs?tab=gallery");
  }

  // Parse remaining search parameters
  const search = typeof params.search === "string" ? params.search : undefined;
  const location =
    typeof params.location === "string" ? params.location : undefined;
  const club_type =
    typeof params.club_type === "string" ? params.club_type : undefined;
  const sortBy = typeof params.sortBy === "string" ? params.sortBy : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;

  const itemsPerPage = 12; // Back to 12 for better UX
  const offset = (page - 1) * itemsPerPage;

  // Parallel data fetching - only fetch memberships if user is authenticated
  const [clubsWithStats, totalCount, userMemberships] = await Promise.all([
    getAllClubsWithStats({
      search,
      location,
      club_type,
      sortBy,
      limit: itemsPerPage,
      offset,
    }),
    getClubsCount({
      search,
      location,
      club_type,
    }),
    currentUser ? getUserClubMemberships(currentUser.id) : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Create a Set of club IDs the user is a member of for quick lookup
  const userClubIds = new Set(userMemberships.map((m) => m.club.id));

  // Transform data to match expected format (already includes memberCount)
  const transformedClubs = clubsWithStats.map((club) => ({
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
    leader: club.leader,
    memberCount: club.memberCount, // Real member count from server
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
        userClubIds={userClubIds}
        pagination={{
          currentPage: page,
          totalPages,
          totalCount,
          itemsPerPage,
        }}
        createClubAction={createClubAction}
        uploadAction={uploadClubImageServerAction}
        joinClubAction={joinClubAction}
        sendClubJoinRequestAction={sendClubJoinRequestAction}
      />
    </Suspense>
  );
}
