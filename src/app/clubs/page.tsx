import { getUserOptional } from "@/lib/auth";
import { ClubTabNavigation } from "@/components/clubs/club-tab-navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { uploadClubImage } from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { Club } from "@/types";
import type { ClubsGalleryData } from "@/types/club";
import { getBaseUrl } from "@/lib/utils";

// Force dynamic rendering - don't try to build statically
export const dynamic = "force-dynamic";

// Server-side clubs gallery data fetching using cached API route
async function getClubsGalleryDataSSR(
  filters: {
    search?: string;
    location?: string;
    club_type?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  },
  currentUserId?: string
): Promise<ClubsGalleryData> {
  const startTime = Date.now();

  try {
    console.log(`🚀 SSR CACHE: Fetching clubs gallery via cached API route...`);

    // Use native fetch to call our cached API route
    const response = await fetch(
      `${getBaseUrl()}/api/clubs?${new URLSearchParams({
        ...(filters.search && { search: filters.search }),
        ...(filters.location && { location: filters.location }),
        ...(filters.club_type && { club_type: filters.club_type }),
        sortBy: filters.sortBy || "likes",
        page: (filters.page || 1).toString(),
        limit: (filters.limit || 12).toString(),
        ...(currentUserId && { userId: currentUserId }),
      })}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Leverage the API route's caching
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      console.error(
        `❌ Clubs API route failed: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch clubs gallery data: ${response.status}`);
    }

    const data = await response.json();

    console.log(
      `✅ SSR CACHE: Clubs gallery data fetched via API route in ${
        Date.now() - startTime
      }ms`
    );

    return {
      clubs: data?.clubs || [],
      pagination: data?.pagination || {
        total: 0,
        page: filters.page || 1,
        limit: filters.limit || 12,
        totalPages: 0,
      },
      filters: {
        search: filters.search || "",
        location: filters.location || "",
        club_type: filters.club_type || "",
        sortBy: filters.sortBy || "likes",
      },
    };
  } catch (error) {
    console.error("Error fetching clubs gallery data:", error);
    throw new Error("Failed to fetch clubs gallery data");
  }
}

// Inline server functions from clubs.ts
async function createClub(clubData: {
  name: string;
  description: string;
  location: string;
  club_type: string;
  banner_image: string;
  leader_id: string;
}): Promise<Club | null> {
  try {
    console.log("=== createClub function called ===");
    console.log("Club data:", clubData);

    const supabase = await createClient();
    console.log("Supabase client created");

    // Insert the club (database will auto-generate UUID)
    const { data: clubInsertData, error: clubError } = await supabase
      .from("clubs")
      .insert({
        name: clubData.name.trim(),
        description: clubData.description.trim(),
        location: clubData.location,
        club_type: clubData.club_type,
        banner_image_url: clubData.banner_image || null,
        leader_id: clubData.leader_id,
      })
      .select()
      .single();

    console.log("Club insert result:", {
      data: clubInsertData,
      error: clubError,
    });

    if (clubError || !clubInsertData) {
      console.error("Error creating club:", clubError);
      return null;
    }

    console.log("Club created successfully, ID:", clubInsertData.id);

    // Add the leader as a member with 'leader' role
    const { error: memberError } = await supabase.from("club_members").insert({
      club_id: clubInsertData.id,
      user_id: clubData.leader_id,
      role: "leader",
    });

    console.log("Club member insert result:", { error: memberError });

    if (memberError) {
      console.error("Error adding leader as member:", memberError);
      // Don't fail the whole operation, but log the error
    }

    // Return the created club with simplified structure
    return {
      id: clubInsertData.id,
      name: clubInsertData.name,
      description: clubInsertData.description,
      banner_image_url: clubInsertData.banner_image_url,
      club_type: clubInsertData.club_type,
      location: clubInsertData.location,
      leader_id: clubInsertData.leader_id,
      total_likes: 0,
      created_at: clubInsertData.created_at,
      updated_at: clubInsertData.updated_at,
      leader: {
        id: clubData.leader_id,
        username: "",
        display_name: "",
        profile_image_url: undefined,
      },
    };
  } catch (error) {
    console.error("=== createClub function error ===", error);
    return null;
  }
}

async function joinClub(
  clubId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Check if already a member
    const { data: existingMember, error: checkError } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing membership:", checkError);
      return { success: false, message: "Failed to check membership status" };
    }

    if (existingMember) {
      return { success: false, message: "Already a member of this club" };
    }

    // Add user to club
    const { error: insertError } = await supabase.from("club_members").insert({
      club_id: clubId,
      user_id: userId,
      role: "member",
    });

    if (insertError) {
      console.error("Error joining club:", insertError);
      return { success: false, message: "Failed to join club" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in joinClub:", error);
    return { success: false, message: "Failed to join club" };
  }
}

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
  return await joinClub(clubId, userId);
}

// Server action wrapper for sending club join request
async function sendClubJoinRequestAction(
  clubId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  "use server";

  try {
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to send a join request",
      };
    }

    const supabase = await createClient();

    // Check if club exists
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("id, name, leader_id")
      .eq("id", clubId)
      .single();

    if (clubError || !club) {
      return { success: false, error: "Club not found" };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return { success: false, error: "You are already a member of this club" };
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("messages")
      .select("id")
      .eq("receiver_id", club.leader_id)
      .eq("sender_id", user.id)
      .eq("message_type", "club_join_request")
      .single();

    if (existingRequest) {
      return {
        success: false,
        error: "You have already sent a join request to this club",
      };
    }

    // Send join request message
    const { error: messageError } = await supabase.from("messages").insert({
      receiver_id: club.leader_id,
      sender_id: user.id,
      subject: `Join Request for ${club.name}`,
      message:
        message || `${user.username} wants to join your club "${club.name}"`,
      message_type: "club_join_request",
      created_at: new Date().toISOString(),
    });

    if (messageError) {
      console.error("Error sending join request:", messageError);
      return { success: false, error: "Failed to send join request" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending club join request:", error);
    return { success: false, error: "Failed to send join request" };
  }
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
  // Parse search parameters for authentication check
  const params = await searchParams;

  // Get user (optional)
  const currentUser = await getUserOptional();

  // Convert search params to initial filters for client component
  const initialFilters = {
    search: typeof params.search === "string" ? params.search : undefined,
    location: typeof params.location === "string" ? params.location : undefined,
    club_type:
      typeof params.club_type === "string" ? params.club_type : undefined,
    sortBy: typeof params.sortBy === "string" ? params.sortBy : "likes",
    page: typeof params.page === "string" ? parseInt(params.page, 10) : 1,
    limit: 12,
  };

  // Fetch initial clubs data for SSR
  let initialData: ClubsGalleryData | null = null;
  try {
    initialData = await getClubsGalleryDataSSR(initialFilters, currentUser?.id);
  } catch (error) {
    console.error("Failed to fetch clubs gallery data on server:", error);
    // Continue without initial data, let client handle the error
  }

  return (
    <ClubTabNavigation
      currentUser={
        currentUser
          ? {
              ...currentUser,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : null
      }
      initialFilters={initialFilters}
      initialData={initialData}
      createClubAction={createClubAction}
      uploadAction={uploadClubImageServerAction}
      joinClubAction={joinClubAction}
      sendClubJoinRequestAction={sendClubJoinRequestAction}
    />
  );
}
