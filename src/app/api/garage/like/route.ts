import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    // Get user authentication (lightweight)
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { carId } = await request.json();

    if (!carId) {
      return NextResponse.json(
        { error: "Car ID is required" },
        { status: 400 }
      );
    }

    // Get environment variables for direct Supabase fetch
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      throw new Error("Server configuration error");
    }

    console.log(
      `🔄 API Route: Toggling like for car ${carId}, user ${authUser.id}`
    );

    // Call the RPC function for car likes using native fetch
    const likeResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/toggle_car_like_optimized`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          car_id_param: carId,
          user_id_param: authUser.id,
        }),
      }
    );

    if (!likeResponse.ok) {
      console.error(`❌ Car Like RPC failed: ${likeResponse.status}`);
      return NextResponse.json(
        { error: "Failed to toggle like" },
        { status: 500 }
      );
    }

    const data = await likeResponse.json();

    console.log("✅ Car Like Success:", data);

    // Car likes are displayed throughout the app (garage, profiles, clubs, homepage, my-pages, etc.)
    // We use a comprehensive revalidation strategy to ensure consistency everywhere
    console.log("🔄 Revalidating entire app due to car like change...");
    
    // Option 1: Revalidate all major cache tags
    revalidateTag("garage");
    revalidateTag("cars");
    revalidateTag("user-garage"); // This will invalidate ALL user garage caches
    revalidateTag("profile");
    revalidateTag("clubs");
    revalidateTag("user-clubs"); // This will invalidate ALL user club caches
    revalidateTag("home-data");
    revalidateTag("leaderboards");
    
    // Option 2: Revalidate from root layout (nuclear option - revalidates everything)
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      newLikeCount: data.new_like_count,
      isLiked: data.is_liked,
      action: data.action,
    });
  } catch (error) {
    console.error("❌ Car Like API Route Exception:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update like" 
      },
      { status: 500 }
    );
  }
}