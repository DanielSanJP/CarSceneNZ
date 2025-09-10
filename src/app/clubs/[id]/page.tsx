import { getUserOptional } from "@/lib/auth";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";
import { createClient } from "@/lib/utils/supabase/server";
import type { ClubDetailData } from "@/types/club";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}

// Server-side club detail data fetching using RPC function
async function getClubDetailDataSSR(clubId: string): Promise<ClubDetailData> {
  const supabase = await createClient();
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.rpc("get_club_detail", {
      club_id_param: clubId,
    });

    if (error) {
      console.error("Error fetching club detail:", error);
      throw new Error("Failed to fetch club detail data");
    }

    console.log(
      `✅ SSR: Club ${clubId} detail fetched in ${Date.now() - startTime}ms`
    );

    return data;
  } catch (error) {
    console.error("Error fetching club detail data:", error);
    throw new Error("Failed to fetch club detail data");
  }
}

export default async function ClubDetailPage({
  params,
  searchParams,
}: ClubDetailPageProps) {
  const { id } = await params;
  const { from = "join", tab = "clubs" } = await searchParams;

  // Get current user (optional)
  const currentUser = await getUserOptional();

  // Fetch club detail data using RPC
  let clubDetailData: ClubDetailData | null = null;
  try {
    clubDetailData = await getClubDetailDataSSR(id);
  } catch (error) {
    console.error("Failed to fetch club detail data on server:", error);
    // Return error state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Failed to load club details
          </h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the club information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <ClubDetailView
            currentUser={currentUser}
            fromTab={from}
            leaderboardTab={tab}
            clubDetailData={clubDetailData}
          />
        </div>
      </div>
    </div>
  );
}

export const revalidate = 300; // 5 minutes
