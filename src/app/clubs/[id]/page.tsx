import { getUserOptional } from "@/lib/auth";
import { ClubDetailView } from "@/components/clubs/display/club-detail-view";
import type { ClubDetailData } from "@/types/club";

interface ClubDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; tab?: string }>;
}

// Server-side club detail data fetching using cached API route
async function getClubDetailDataSSR(
  clubId: string,
  currentUserId?: string
): Promise<ClubDetailData> {
  const startTime = Date.now();

  try {
    console.log(
      `🚀 SSR CACHE: Fetching club ${clubId} detail via cached API route...`
    );

    // Use native fetch to call our cached API route
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/clubs/${clubId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId || null,
        }),
        // Leverage the API route's caching
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Club not found");
      }
      console.error(
        `❌ Club detail API route failed: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to fetch club detail data: ${response.status}`);
    }

    const data = await response.json();

    console.log(
      `✅ SSR CACHE: Club ${clubId} detail fetched via API route in ${
        Date.now() - startTime
      }ms`
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

  // Fetch club detail data using cached API route
  let clubDetailData: ClubDetailData | null = null;
  try {
    clubDetailData = await getClubDetailDataSSR(id, currentUser?.id);
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
