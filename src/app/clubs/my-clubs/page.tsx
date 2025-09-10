import { MyClubView } from "@/components/clubs/my-club-view";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import type { UserClubsData } from "@/types/club";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Server-side user clubs data fetching using RPC function
async function getUserClubsDataSSR(userId: string): Promise<UserClubsData> {
  const supabase = await createClient();
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.rpc("get_user_clubs", {
      user_id_param: userId,
    });

    if (error) {
      console.error("Error fetching user clubs:", error);
      throw new Error("Failed to fetch user clubs data");
    }

    console.log(
      `✅ SSR: User ${userId} clubs fetched in ${Date.now() - startTime}ms`
    );

    return data;
  } catch (error) {
    console.error("Error fetching user clubs data:", error);
    throw new Error("Failed to fetch user clubs data");
  }
}

export default async function MyClubsPage() {
  // Server-side auth check - redirects if not authenticated
  const user = await getUser();

  // Fetch user clubs data using RPC
  let userClubsData: UserClubsData | null = null;
  try {
    userClubsData = await getUserClubsDataSSR(user.id);
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

  return <MyClubView userClubsData={userClubsData} />;
}
