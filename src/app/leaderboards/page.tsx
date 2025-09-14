import { LeaderboardsView } from "@/components/leaderboard/leaderboards-view";
import type { LeaderboardsData } from "@/types/leaderboard";
import { getBaseUrl } from "@/lib/utils";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Server-side leaderboards data fetching using cached API route
async function getLeaderboardsData(): Promise<LeaderboardsData> {
  const startTime = Date.now();

  console.log(
    "🚀 FETCH CACHE: Fetching leaderboards using cached API route..."
  );

  try {
    // Use our cached API route with native fetch for caching
    const response = await fetch(`${getBaseUrl()}/api/leaderboards?limit=200`, {
      // Enable Next.js caching with 5 minute revalidation
      next: {
        revalidate: 300, // 5 minutes
        tags: ["leaderboards"],
      },
    });

    console.log(`🔍 DEBUG: API response status: ${response.status}`);

    if (!response.ok) {
      console.error(
        `❌ Leaderboards API failed: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch leaderboards: ${response.status}`);
    }

    const leaderboardsData = await response.json();

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Leaderboards data fetched in ${endTime - startTime}ms`
    );
    console.log(
      `📊 Data counts - Cars: ${leaderboardsData.cars?.length || 0}, Owners: ${
        leaderboardsData.owners?.length || 0
      }, Clubs: ${leaderboardsData.clubs?.length || 0}`
    );

    return leaderboardsData;
  } catch (error) {
    console.error("❌ Error fetching leaderboards data:", error);
    throw new Error("Failed to load leaderboards data");
  }
}

interface LeaderboardsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function LeaderboardsPage({
  searchParams,
}: LeaderboardsPageProps) {
  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get tab from search params, default to 'owners'
  const tab = resolvedSearchParams.tab || "owners";
  const validTab = ["owners", "clubs", "cars"].includes(tab) ? tab : "owners";

  try {
    // Fetch leaderboards data using cached API route
    const leaderboardsData = await getLeaderboardsData();

    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              🏆 Community Leaderboards
            </h1>
            <p className="text-muted-foreground">
              See who&apos;s leading the pack in cars, clubs, and owners
            </p>
          </div>

          <LeaderboardsView
            defaultTab={validTab as "owners" | "clubs" | "cars"}
            leaderboardsData={leaderboardsData}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading leaderboards:", error);
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">🏆 Community Leaderboards</h1>
          <p className="text-muted-foreground mb-6">
            Sorry, we couldn&apos;t load the leaderboards right now.
          </p>
        </div>
      </div>
    );
  }
}
