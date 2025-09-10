import { LeaderboardsView } from "@/components/leaderboard/leaderboards-view";

// Force dynamic rendering for real-time leaderboards
export const dynamic = "force-dynamic";

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;

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
          />
        </div>
      </div>
    </div>
  );
}
