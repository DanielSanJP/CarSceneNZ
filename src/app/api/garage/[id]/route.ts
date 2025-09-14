import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body?.userId;
    const startTime = Date.now();

    console.log(`🚀 FETCH CACHE: Fetching car ${id} details via API route...`);

    // Get environment variables for direct Supabase fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    // Fetch car details using native fetch for caching
    const carDetailResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_car_detail_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          car_id_param: id,
          user_id_param: userId || null,
        }),
        // Enable Next.js caching with 5 minute revalidation
        next: {
          revalidate: 300, // 5 minutes
          tags: ["garage", "cars", `car-${id}`],
        },
      }
    );

    if (!carDetailResponse.ok) {
      console.error(`❌ Car detail RPC failed: ${carDetailResponse.status}`);
      if (carDetailResponse.status === 404) {
        return NextResponse.json(
          { error: "Car not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch car details" },
        { status: carDetailResponse.status }
      );
    }

    const carDetailData = await carDetailResponse.json();

    if (!carDetailData) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Car ${id} details fetched and processed in ${
        endTime - startTime
      }ms`
    );

    return NextResponse.json(carDetailData);
  } catch (error) {
    console.error("❌ Error fetching car details:", error);
    return NextResponse.json(
      { error: "Failed to load car details" },
      { status: 500 }
    );
  }
}