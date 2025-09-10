import { Homepage } from "@/components/homepage";
import { getHomeData } from "@/hooks/use-home";
import type { HomeData } from "@/hooks/use-home";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function HomePage() {
  // Fetch initial home data directly in server component
  let initialData: HomeData | null = null;
  try {
    initialData = await getHomeData();
  } catch (error) {
    console.error("Failed to fetch home data on server:", error);
    // We'll let the client-side hook handle the error and retry
  }

  return <Homepage initialData={initialData} />;
}
