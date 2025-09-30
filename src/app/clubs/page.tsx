import { getAuthUser, requireAuth, getUserProfile } from "@/lib/auth";
import { ClubTabNavigation } from "@/components/clubs/club-tab-navigation";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadClubImage } from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { Club } from "@/types";
import type { ClubsGalleryData } from "@/types/club";
// Force dynamic rendering - don't try to build statically
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes

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
    console.log(`🚀 SSR CACHE: Fetching clubs gallery via direct queries...`);

    const supabase = await createClient();

    // Get query parameters
    const search = filters.search || null;
    const location = filters.location || null;
    const club_type = filters.club_type || null;
    const sortBy = filters.sortBy || "likes";
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 12, 50);

    console.log(
      `🔍 DEBUG: Fetching clubs - Page ${page}, Limit ${limit}, Sort: ${sortBy}`
    );
    console.log(
      `🔍 DEBUG: Filters - Search: ${search}, Location: ${location}, Type: ${club_type}`
    );

    const offset = (page - 1) * limit;

    // Build the query dynamically with filters using club_stats view for accurate total_likes
    let query = supabase.from("club_stats").select(`
        id,
        name,
        description,
        banner_image_url,
        club_type,
        location,
        leader_id,
        calculated_total_likes,
        member_count,
        total_cars,
        created_at,
        updated_at
      `);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply location filter
    if (location) {
      query = query.eq("location", location);
    }

    // Apply club type filter
    if (club_type) {
      query = query.eq("club_type", club_type);
    }

    // Apply sorting
    switch (sortBy) {
      case "likes":
        query = query.order("calculated_total_likes", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      default:
        query = query.order("calculated_total_likes", { ascending: false });
    }

    // Get total count for pagination (with same filters) using club_stats view
    let countQuery = supabase
      .from("club_stats")
      .select("*", { count: "exact", head: true });

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }
    if (location) {
      countQuery = countQuery.eq("location", location);
    }
    if (club_type) {
      countQuery = countQuery.eq("club_type", club_type);
    }

    const { count: totalCount } = await countQuery;

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clubs, error: clubsError } = await query;

    if (clubsError) {
      console.error("❌ Error fetching clubs:", clubsError);
      throw clubsError;
    }

    console.log(
      `🔍 DEBUG: Fetched ${clubs?.length || 0} clubs from club_stats view`
    );

    // Get leader info for all clubs manually (since views don't have foreign key relationships)
    const leaderIds = clubs?.map((club) => club.leader_id) || [];
    const leadersMap: Record<
      string,
      {
        id: string;
        username: string;
        display_name: string | null;
        profile_image_url: string | null;
      }
    > = {};

    if (leaderIds.length > 0) {
      const { data: leaders } = await supabase
        .from("users")
        .select("id, username, display_name, profile_image_url")
        .in("id", leaderIds);

      leaders?.forEach((leader) => {
        leadersMap[leader.id] = leader;
      });
    }

    // Get user memberships if userId is provided
    const clubIds = clubs?.map((club) => club.id) || [];
    const userMemberships: Record<string, boolean> = {};

    if (clubIds.length > 0 && currentUserId) {
      const { data: userMembershipData } = await supabase
        .from("club_members")
        .select("club_id")
        .eq("user_id", currentUserId)
        .in("club_id", clubIds);

      userMembershipData?.forEach((membership) => {
        userMemberships[membership.club_id] = true;
      });
    }

    console.log(
      `✅ SSR CACHE: Clubs gallery data fetched via direct queries in ${
        Date.now() - startTime
      }ms`
    );

    // Transform clubs data to match interface
    const transformedClubs =
      clubs?.map((club) => ({
        id: club.id,
        name: club.name,
        description: club.description,
        banner_image_url: club.banner_image_url,
        club_type: club.club_type,
        location: club.location,
        leader_id: club.leader_id,
        total_likes: club.calculated_total_likes,
        created_at: club.created_at,
        updated_at: club.updated_at,
        leader: leadersMap[club.leader_id]
          ? {
              ...leadersMap[club.leader_id],
              display_name:
                leadersMap[club.leader_id].display_name || undefined,
              profile_image_url:
                leadersMap[club.leader_id].profile_image_url || undefined,
            }
          : undefined,
        memberCount: club.member_count,
        isUserMember: currentUserId ? userMemberships[club.id] || false : false,
      })) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return {
      clubs: transformedClubs,
      pagination: {
        total: totalCount || 0,
        page,
        limit,
        totalPages,
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

    // Force revalidation of club pages and related data after successful join
    try {
      // Revalidate the specific club page
      revalidatePath(`/clubs/${clubId}`);
      // Revalidate the user's clubs page
      revalidatePath("/clubs/my-clubs");
      // Revalidate general clubs page
      revalidatePath("/clubs");

      console.log(
        `🔄 Cache invalidated for club ${clubId} and user ${userId} after join`
      );
    } catch (revalidateError) {
      console.error("❌ Error during cache revalidation:", revalidateError);
      // Don't fail the request if revalidation fails
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

// Server action that directly handles club join requests
async function sendClubJoinRequestAction(
  clubId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  "use server";

  try {
    const authUser = await requireAuth();
    const currentUser = await getUserProfile(authUser.id);

    if (!currentUser) {
      return { success: false, error: "Failed to load user profile" };
    }

    console.log("📥 Join request received:", {
      clubId,
      message,
      clubIdType: typeof clubId,
    });

    if (!clubId) {
      return { success: false, error: "Club ID is required" };
    }

    const supabase = await createClient();

    // Check if club exists and get its type
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("id, name, leader_id, club_type")
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
      .eq("user_id", currentUser.id)
      .single();

    if (existingMember) {
      return { success: false, error: "You are already a member of this club" };
    }

    // Check if user already has a pending request
    const { data: existingRequest } = await supabase
      .from("messages")
      .select("id")
      .eq("club_id", clubId)
      .eq("sender_id", currentUser.id)
      .eq("message_type", "club_join_request")
      .eq("is_read", false)
      .single();

    if (existingRequest) {
      return {
        success: false,
        error: "You already have a pending request to join this club",
      };
    }

    // Validate club allows join requests
    if (club.club_type === "closed") {
      return {
        success: false,
        error: "This club is closed and not accepting new members",
      };
    }

    if (club.club_type === "open") {
      return {
        success: false,
        error:
          "This is an open club. You can join directly without requesting permission.",
      };
    }

    // For invite-only clubs, send a request to club leaders
    if (club.club_type === "invite") {
      const messageText =
        message ||
        `${currentUser.username} wants to join your club "${club.name}"`;

      const { error: messageError } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: club.leader_id,
        subject: `Join Request for ${club.name}`,
        message: messageText,
        message_type: "club_join_request",
        club_id: clubId,
        is_read: false,
        created_at: new Date().toISOString(),
      });

      if (messageError) {
        console.error("❌ Error sending join request message:", messageError);
        return { success: false, error: "Failed to send join request" };
      }

      // Note: Database trigger will handle real-time notifications

      console.log(`✅ Join request sent for invite-only club ${club.name}`);

      // Only revalidate inbox since that's where the message will appear
      revalidatePath("/inbox");

      return { success: true };
    }

    return { success: false, error: "Invalid club type" };
  } catch (error) {
    console.error("Error sending join request:", error);
    return { success: false, error: "Failed to send join request" };
  }
}

async function createClubAction(formData: FormData) {
  "use server";

  console.log("=== Starting club creation server action (from clubs page) ===");

  const authUser = await requireAuth();
  console.log("User authenticated:", authUser?.id);

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
      leader_id: authUser.id, // Ensure the creator is the leader
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
  const authUser = await getAuthUser();
  const currentUser = authUser ? await getUserProfile(authUser.id) : null;

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
