import { UserProfileDisplay } from "@/components/profile/user-profile-display";
import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import type { ProfileData } from "@/types/user";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

// Server action for following/unfollowing users
async function followUserAction(
  targetUserId: string,
  action: "follow" | "unfollow"
) {
  "use server";

  const user = await getUserOptional();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();

  try {
    console.log(
      `🔄 Server Action: ${action} user ${targetUserId}, current user ${user.id}`
    );

    const { data, error } = await supabase.rpc("toggle_user_follow_optimized", {
      follower_id_param: user.id,
      following_id_param: targetUserId,
    });

    if (error) {
      console.error("❌ Follow/Unfollow RPC Error:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅ ${action} Success:`, data);

    // Revalidate relevant pages
    revalidatePath(`/profile/${targetUserId}`);
    revalidatePath("/"); // Homepage might show followed users' content

    // Also try to get the username for revalidation
    const { data: targetUser } = await supabase
      .from("users")
      .select("username")
      .eq("id", targetUserId)
      .single();

    if (targetUser?.username) {
      revalidatePath(`/profile/${targetUser.username}`);
    }

    return {
      success: true,
      action: data.action,
      isFollowing: data.isFollowing,
      newFollowersCount: data.newFollowersCount,
    };
  } catch (error) {
    console.error("❌ Follow/Unfollow Server Action Exception:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : `Failed to ${action} user`,
    };
  }
}

// Server-side profile data fetching using RPC function
async function getProfileDataSSR(
  usernameOrId: string,
  currentUserId?: string
): Promise<ProfileData> {
  const supabase = await createClient();
  const startTime = Date.now();

  try {
    console.log(
      `🚀 SSR: Fetching profile ${usernameOrId} using optimized RPC...`
    );

    // Check if the input looks like a UUID (36 characters with hyphens)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        usernameOrId
      );

    let profileData;
    if (isUUID) {
      // Call RPC function with UUID
      const { data, error } = await supabase.rpc("get_profile_data_optimized", {
        target_user_id_param: usernameOrId,
        current_user_id_param: currentUserId || null,
      });

      if (error) {
        console.error("Error fetching profile by ID:", error);
        throw new Error("User not found");
      }
      profileData = data;
    } else {
      // Call RPC function with username
      const { data, error } = await supabase.rpc("get_profile_data_optimized", {
        username_param: usernameOrId,
        current_user_id_param: currentUserId || null,
      });

      if (error) {
        console.error("Error fetching profile by username:", error);
        throw new Error("User not found");
      }
      profileData = data;
    }

    console.log(
      `✅ SSR: Profile ${usernameOrId} data fetched in ${
        Date.now() - startTime
      }ms`
    );

    return profileData as ProfileData;
  } catch (error) {
    console.error("Error fetching profile data:", error);
    throw new Error("Failed to fetch profile data");
  }
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: usernameOrId } = await params;

  // Get current user (optional)
  const currentUser = await getUserOptional();

  // Fetch profile data using RPC functions
  let profileData: ProfileData | null = null;

  try {
    profileData = await getProfileDataSSR(usernameOrId, currentUser?.id);
  } catch (error) {
    console.error("Failed to fetch profile data on server:", error);
    // Return error state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Failed to load profile</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the profile information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <UserProfileDisplay
      profileData={profileData}
      currentUser={currentUser}
      followUserAction={followUserAction}
    />
  );
}

export const revalidate = 300; // 5 minutes
