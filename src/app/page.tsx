import {
  Homepage,
  type HomeData,
  type ProcessedHomeData,
  type HomeUser,
} from "@/components/homepage";
import { createClient } from "@/lib/utils/supabase/server";

// Cache this page for 15 minutes like other pages
export const revalidate = 900; // 15 minutes

// Server-side function to get home data using optimized RPC
async function getHomeData(): Promise<HomeData> {
  const supabase = await createClient();

  const { data: homeData, error } = await supabase
    .rpc("get_home_data_optimized")
    .single();

  if (error) {
    console.error("Error fetching home data:", error);
    throw new Error("Failed to fetch home page data");
  }

  if (!homeData) {
    throw new Error("No home page data found");
  }

  return homeData as HomeData;
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
  const usersMap = homeData.users.reduce((map, user) => {
    map[user.id] = user;
    return map;
  }, {} as Record<string, HomeUser>);

  return {
    ...homeData,
    upcomingEvents,
    featuredCars,
    usersMap,
  };
}

export default async function HomePage() {
  // Fetch and process home data directly on server
  let processedHomeData: ProcessedHomeData | null = null;
  const startTime = Date.now();

  try {
    console.log("🚀 SSR: Fetching home data using optimized RPC...");
    const rawHomeData = await getHomeData();
    processedHomeData = processHomeData(rawHomeData);
    console.log(
      `✅ SSR: Home data fetched and processed in ${Date.now() - startTime}ms`
    );
  } catch (error) {
    console.error("Failed to fetch home data on server:", error);
    // Return null and let the component handle the error state
  }

  return <Homepage homeData={processedHomeData} />;
}
