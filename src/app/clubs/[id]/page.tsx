import { getUserOptional } from "@/lib/auth";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: ClubDetailPageProps) {
  const { id } = await params;
  const { from = "join", tab = "clubs" } = await searchParams;

  // Get current user (optional)
  const currentUser = await getUserOptional();

  // Let the client component handle all data fetching through React Query + RPC
  // This follows the same pattern as other pages in the app
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <ClubDetailView
            clubId={id}
            currentUser={currentUser}
            fromTab={from}
            leaderboardTab={tab}
          />
        </div>
      </div>
    </div>
  );
}
