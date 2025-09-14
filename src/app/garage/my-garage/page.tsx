import MyGarageView from "@/components/garage/my-garage-view";
import { getUser } from "@/lib/auth";
import { UserGarageData } from "@/types/car";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function MyGaragePage() {
  // Server-side auth check - this will redirect if not authenticated
  const user = await getUser();

  console.log(
    "🚀 SSR CACHE: Fetching user garage data via cached API route..."
  );
  const startTime = Date.now();

  // Use native fetch to call our cached API route
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/garage/my-garage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
      }),
      // Leverage the API route's caching
      next: { revalidate: 60 },
    }
  );

  if (!response.ok) {
    console.error(
      `❌ My garage API route failed: ${response.status} ${response.statusText}`
    );
    throw new Error("Failed to load your garage");
  }

  const garageData: UserGarageData = await response.json();

  console.log(
    `✅ SSR CACHE: User garage data fetched via API route in ${
      Date.now() - startTime
    }ms`
  );

  const finalGarageData: UserGarageData = garageData || {
    cars: [],
    total: 0,
    meta: {
      generated_at: new Date().toISOString(),
      cache_key: "",
    },
  };

  return <MyGarageView garageData={finalGarageData} />;
}
