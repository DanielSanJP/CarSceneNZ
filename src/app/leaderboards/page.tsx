import { LeaderboardsView } from "@/components/leaderboard/leaderboards-view";
import { getLeaderboardsData } from "@/hooks/use-leaderboards";
import type { LeaderboardsData } from "@/hooks/use-leaderboards";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;

  // Fetch initial leaderboards data directly in server component
  let initialData: LeaderboardsData | null = null;
  try {
    initialData = await getLeaderboardsData();
  } catch (error) {
    console.error("Failed to fetch leaderboards data on server:", error);
    // We'll let the client-side hook handle the error and retry
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Community Leaderboards
            </h1>
            <p className="text-xl text-muted-foreground">
              Top performers in the Car Scene NZ community
            </p>
          </div>

          <LeaderboardsView
            defaultTab={params.tab as "owners" | "clubs" | "cars"}
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  );
}
