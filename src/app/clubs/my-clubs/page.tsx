import { MyClubView } from "@/components/clubs/my-club-view";
import { requireAuth } from "@/lib/auth";
import type { UserClubsData } from "@/types/club";
import { createClient } from "@/lib/utils/supabase/server";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function MyClubsPage() {
  // Server-side auth check - redirects if not authenticated
  const authUser = await requireAuth();

  console.log("🚀 SSR CACHE: Fetching user clubs via direct queries...");
  const startTime = Date.now();

  // Use direct Supabase queries
  let userClubsData: UserClubsData | null = null;
  try {
    const supabase = await createClient();

    // Get user's club memberships first
    const { data: userMemberships, error: membershipsError } = await supabase
      .from("club_members")
      .select("club_id, role, joined_at")
      .eq("user_id", authUser.id)
      .order("joined_at", { ascending: false });

    if (membershipsError) {
      console.error("❌ Error fetching user memberships:", membershipsError);
      throw membershipsError;
    }

    if (!userMemberships || userMemberships.length === 0) {
      console.log(`📋 User ${authUser.id} is not a member of any clubs`);
      userClubsData = {
        clubs: [],
        total: 0,
        meta: {
          generated_at: new Date().toISOString(),
          cache_key: `my_clubs_${authUser.id}`,
        },
      };
    } else {
      // Get club details from club_stats view for accurate total_likes
      const clubIds = userMemberships.map((m) => m.club_id);
      const { data: clubs, error: clubsError } = await supabase
        .from("club_stats")
        .select("*")
        .in("id", clubIds);

      if (clubsError) {
        console.error("❌ Error fetching club details:", clubsError);
        throw clubsError;
      }

      // Get leader info for all clubs
      const leaderIds = clubs?.map((club) => club.leader_id) || [];
      const leadersMap: Record<
        string,
        {
          id: string;
          username: string;
          display_name?: string;
          profile_image_url?: string;
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

      // Transform data to match UserClubsData interface
      userClubsData = {
        clubs:
          userMemberships
            ?.map((membership) => {
              const club = clubs?.find((c) => c.id === membership.club_id);
              const leader = leadersMap[club?.leader_id || ""];

              return {
                club: {
                  id: club?.id,
                  name: club?.name,
                  description: club?.description,
                  banner_image_url: club?.banner_image_url,
                  club_type: club?.club_type,
                  location: club?.location,
                  leader_id: club?.leader_id,
                  total_likes: club?.calculated_total_likes || 0, // Use calculated value from view
                  created_at: club?.created_at,
                  updated_at: club?.updated_at,
                  leader: leader
                    ? {
                        id: leader.id,
                        username: leader.username,
                        display_name: leader.display_name,
                        profile_image_url: leader.profile_image_url,
                      }
                    : undefined,
                },
                role: membership.role,
                joined_at: membership.joined_at,
                memberCount: club?.member_count || 0, // Use pre-calculated member count from view
              };
            })
            .filter((item) => item.club.id) || [], // Filter out any clubs that weren't found
        total: userMemberships?.length || 0,
        meta: {
          generated_at: new Date().toISOString(),
          cache_key: `my_clubs_${authUser.id}`,
        },
      };
    }

    console.log(
      `✅ SSR CACHE: User clubs fetched via direct queries in ${
        Date.now() - startTime
      }ms`
    );
  } catch (error) {
    console.error("Failed to fetch user clubs data on server:", error);
    // Return error state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Failed to load your clubs</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading your club information.
          </p>
        </div>
      </div>
    );
  }

  return <MyClubView userClubsData={userClubsData!} />;
}
