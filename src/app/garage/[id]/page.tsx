import { getUserOptional } from "@/lib/auth";
import { CarDetailView } from "@/components/garage/display/car-detail-view";
import { notFound } from "next/navigation";
import type { CarDetailData } from "@/types/car";
import { getBaseUrl } from "@/lib/utils";

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper function to get car details using cached API route
async function getCarDetailData(
  carId: string,
  userId?: string
): Promise<CarDetailData> {
  const startTime = Date.now();

  console.log(
    `🚀 FETCH CACHE: Fetching car ${carId} details using API route...`
  );

  try {
    // Use our API route with Next.js native fetch for caching
    const response = await fetch(`${getBaseUrl()}/api/garage/${carId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
      }),
      // Enable Next.js caching with 5 minute revalidation
      next: {
        revalidate: 300, // 5 minutes
        tags: ["garage", "cars", `car-${carId}`],
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Car not found");
      }
      throw new Error(`Failed to fetch car: ${response.status}`);
    }

    const carDetailData = await response.json();

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Car ${carId} details fetched in ${endTime - startTime}ms`
    );

    return carDetailData;
  } catch (error) {
    console.error("❌ Error fetching car details:", error);
    throw error;
  }
}

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CarDetailsPage({ params }: CarDetailPageProps) {
  const { id } = await params;

  try {
    // Get user directly in server component
    const user = await getUserOptional();

    // Get car details using our cached API route
    const carDetailData = await getCarDetailData(id, user?.id);

    return <CarDetailView user={user} carDetailData={carDetailData} />;
  } catch (error) {
    console.error("Error loading car:", error);
    notFound();
  }
}
