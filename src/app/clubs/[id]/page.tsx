import { getUserOptional } from "@/lib/auth";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";
import { getClubDetailData, type ClubDetailData } from "@/hooks/use-clubs";

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

  // Fetch initial data for SSR
  let initialData: ClubDetailData | null = null;
  try {
    initialData = await getClubDetailData(id);
  } catch (error) {
    console.error("Failed to fetch club detail data on server:", error);
    // Continue without initial data, let client handle the error
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <ClubDetailView
            clubId={id}
            currentUser={currentUser}
            fromTab={from}
            leaderboardTab={tab}
            initialData={initialData}
          />
        </div>
      </div>
    </div>
  );
}

export const revalidate = 300; // 5 minutes
