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

// Add debugging for ISR behavior
console.log("🔍 DEBUG: Module-level code executing - page.tsx loaded");
console.log("🔍 DEBUG: Revalidate setting:", 900);

// Server-side function to get home data using direct Supabase RPC call
async function getHomeData(): Promise<HomeData> {
  console.log("🔍 DEBUG: getHomeData() function called - Direct Supabase call");

  try {
    const supabase = await createClient();

    console.log("🔍 DEBUG: Calling Supabase RPC get_home_data_optimized...");

    const { data, error } = await supabase.rpc("get_home_data_optimized");

    if (error) {
      console.error("❌ Supabase RPC error:", error);
      throw error;
    }

    if (!data) {
      throw new Error("No data returned from RPC call");
    }

    console.log("🔍 DEBUG: Received data:", {
      eventsCount: data.events?.length || 0,
      carsCount: data.cars?.length || 0,
      clubsCount: data.clubs?.length || 0,
      usersCount: data.users?.length || 0,
    });

    const homeData: HomeData = data;

    console.log("🔍 DEBUG: Direct Supabase call completed");

    if (!homeData) {
      throw new Error("No home page data found");
    }

    console.log("🔍 DEBUG: getHomeData() returning data");
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
  // Add debugging to understand ISR behavior
  console.log("🔍 DEBUG: HomePage component is executing");
  console.log("🔍 DEBUG: Current time:", new Date().toISOString());
  console.log("🔍 DEBUG: Revalidate setting:", 900);

  // Fetch and process home data once on server (ISR pattern)
  let processedHomeData: ProcessedHomeData | null = null;
  const startTime = Date.now();

  try {
    console.log(
      "🚀 FETCH CACHE: Fetching home data using API route with native fetch..."
    );
    console.log("🔍 DEBUG: About to call getHomeData()");
    const rawHomeData = await getHomeData();
    console.log("🔍 DEBUG: getHomeData() completed, now processing...");
    processedHomeData = processHomeData(rawHomeData);
    console.log(
      `✅ FETCH CACHE: Home data fetched and processed in ${
        Date.now() - startTime
      }ms`
    );
    console.log("🔍 DEBUG: Data processing complete");
  } catch (error) {
    console.error("Failed to fetch home data on server:", error);
    // Return null and let the component handle the error state
  }

  console.log("🔍 DEBUG: About to return Homepage component");
  // FETCH CACHE: Pass data directly to client component (using Next.js fetch caching)
  return <Homepage homeData={processedHomeData} />;
}
