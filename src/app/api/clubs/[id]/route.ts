import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await request.json(); // Read body to maintain POST compatibility but don't use it
    const startTime = Date.now();

    console.log(`🚀 FETCH CACHE: Fetching club ${id} detail via API route...`);

    // Get environment variables for native fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(`🔍 DEBUG: Fetching club detail for club ${id}`);

    // Call Supabase RPC function using native fetch for caching
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_club_detail`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          club_id_param: id,
        }),
        // Enable Next.js caching with 5 minute revalidation
        next: {
          revalidate: 300, // 5 minutes
          tags: ["clubs", `club-${id}`],
        },
      }
    );

    console.log(`🔍 DEBUG: Club detail RPC response status: ${response.status}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Club not found" },
          { status: 404 }
        );
      }
      console.error(`❌ Club detail RPC failed: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch club detail: ${response.status}`);
    }

    const clubDetailData = await response.json();

    console.log(`🔍 DEBUG: Club detail RPC returned data for club: ${clubDetailData?.club?.name || 'unknown'}`);

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Club ${id} detail fetched and processed in ${endTime - startTime}ms`);

    return NextResponse.json(clubDetailData);
  } catch (error) {
    console.error("❌ Error fetching club detail data:", error);
    return NextResponse.json(
      { error: "Failed to fetch club detail data" },
      { status: 500 }
    );
  }
}