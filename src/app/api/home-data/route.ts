import { NextResponse } from "next/server";
import type { HomeData } from "@/components/homepage";

export async function GET() {
  console.log("🔍 API Route: /api/home-data called");
  console.log("🔍 API Route: Current time:", new Date().toISOString());
  console.log("🔍 API Route: Cache tags: ['home-data', 'cars', 'events']");
  console.log("🔍 API Route: Environment check:", {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Use native fetch with Next.js caching
    // This should be cached by Next.js automatically
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_home_data_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        // Add timeout and signal handling
        signal: AbortSignal.timeout(10000), // 10 second timeout
        // Enable Next.js caching with 15 minute revalidation
        next: { 
          revalidate: 900, // 15 minutes
          tags: ["home-data", "cars", "events"] // Add cache tags for selective invalidation
        }
      }
    );

    console.log("🔍 API Route: Fetch response status:", response.status);
    console.log("🔍 API Route: Cache headers:", {
      cacheControl: response.headers.get('cache-control'),
      age: response.headers.get('age'),
      etag: response.headers.get('etag'),
    });

    if (!response.ok) {
      // Log the error response for debugging
      const errorText = await response.text();
      console.error("🔍 API Route: Error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
    }

    const homeData: HomeData = await response.json();
    
    console.log("🔍 API Route: Data fetched successfully");
    console.log("🔍 API Route: Events count:", homeData.events?.length || 0);
    console.log("🔍 API Route: Cars count:", homeData.cars?.length || 0);

    // Return with headers optimized for fetch-level caching
    return NextResponse.json(homeData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900', // 5 min cache, 15 min stale
      }
    });

  } catch (error) {
    console.error("❌ API Route: Error fetching home data:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        console.error("⏰ API Route: Request timed out");
        return NextResponse.json(
          { error: "Request timed out. Please try again." },
          { status: 408 }
        );
      }
      
      if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
        console.error("🔌 API Route: Connection refused");
        return NextResponse.json(
          { error: "Database connection failed. Please try again." },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: "Failed to fetch home data" },
      { status: 500 }
    );
  }
}