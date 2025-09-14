import { MyClubView } from "@/components/clubs/my-club-view";
import { requireAuth } from "@/lib/auth";
import type { UserClubsData } from "@/types/club";
import { getBaseUrl } from "@/lib/utils";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function MyClubsPage() {
  // Server-side auth check - redirects if not authenticated
  const authUser = await requireAuth();

  console.log("🚀 SSR CACHE: Fetching user clubs via cached API route...");
  const startTime = Date.now();

  // Use native fetch to call our cached API route
  let userClubsData: UserClubsData | null = null;
  try {
    const response = await fetch(`${getBaseUrl()}/api/clubs/my-clubs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: authUser.id,
      }),
      // Leverage the API route's caching
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(
        `❌ My clubs API route failed: ${response.status} ${response.statusText}`
      );
      throw new Error("Failed to load your clubs");
    }

    userClubsData = await response.json();

    console.log(
      `✅ SSR CACHE: User clubs fetched via API route in ${
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
