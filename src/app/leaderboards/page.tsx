import {
  getTopOwners,
  getTopClubs,
  getTopCars,
} from "@/lib/server/leaderboards";
import { LeaderboardsView } from "@/components/leaderboard/leaderboards-view";

export default async function LeaderboardsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;
  const itemsPerPage = 200; // Show top 200 in each category

  // Fetch all leaderboard data on server with increased limit
  const [ownersData, clubsData, carsData] = await Promise.all([
    getTopOwners(itemsPerPage),
    getTopClubs(itemsPerPage),
    getTopCars(itemsPerPage),
  ]);

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
            ownersData={ownersData}
            clubsData={clubsData}
            carsData={carsData}
            defaultTab={params.tab as "owners" | "clubs" | "cars"}
          />
        </div>
      </div>
    </div>
  );
}
