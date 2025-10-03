import {
  Homepage,
  type HomeData,
  type ProcessedHomeData,
  type HomeUser,
} from "@/components/homepage";
import { createClient } from "@/lib/utils/supabase/server";

// Force dynamic rendering - don't try to build statically
export const dynamic = "force-dynamic";
export const revalidate = 900; // 15 minutes

// Server-side function to get home data using direct Supabase RPC call
async function getHomeData(): Promise<HomeData> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_home_data_optimized");

    if (error) {
      console.error("❌ Supabase RPC error:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from RPC call");
    }

    const homeData: HomeData = data;

    if (!homeData) {
      throw new Error("No home page data found");
    }

    return homeData;
  } catch (error) {
    console.error("❌ Error fetching home data:", error);

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new Error("Request timed out. Please refresh the page.");
      } else if (
        error.message.includes("connection") ||
        error.message.includes("network")
      ) {
        throw new Error("Database connection failed. Please try again later.");
      }
    }

    throw new Error("Failed to fetch home data. Please try again.");
  }
}

// Server-side function to process home data
function processHomeData(homeData: HomeData): ProcessedHomeData {
  // Process upcoming events (filter for future dates and sort)
  const upcomingEvents = homeData.events
    .filter((event) => {
      if (!event.daily_schedule || event.daily_schedule.length === 0)
        return false;
      return new Date(event.daily_schedule[0].date) > new Date();
    })
    .sort((a, b) => {
      if (!a.daily_schedule?.[0] || !b.daily_schedule?.[0]) return 0;
      return (
        new Date(a.daily_schedule[0].date).getTime() -
        new Date(b.daily_schedule[0].date).getTime()
      );
    })
    .slice(0, 3);

  // Process featured cars (sort by likes, take top 3)
  const featuredCars = homeData.cars
    .sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0))
    .slice(0, 3);

  // Create users map for quick lookups
  const usersMap = homeData.users.reduce(
    (map, user) => {
      map[user.id] = user;
      return map;
    },
    {} as Record<string, HomeUser>
  );

  return {
    ...homeData,
    upcomingEvents,
    featuredCars,
    usersMap,
  };
}

export default async function HomePage() {
  // Fetch and process home data once on server (ISR pattern)
  let processedHomeData: ProcessedHomeData | null = null;

  try {
    const rawHomeData = await getHomeData();
    processedHomeData = processHomeData(rawHomeData);
  } catch (error) {
    console.error("Failed to fetch home data on server:", error);
    // Return null and let the component handle the error state
  }

  // Pass data directly to client component (using Next.js fetch caching)
  return <Homepage homeData={processedHomeData} />;
}
