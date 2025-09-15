import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { createClient } from '@/lib/utils/supabase/server';
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

    const supabase = await createClient();

    console.log(`🔄 SIMPLE: Toggling like for car ${carId}, user ${authUser.id}`);

    // 1. Check if user already liked this car
    const { data: existingLike } = await supabase
      .from('car_likes')
      .select('id')
      .eq('car_id', carId)
      .eq('user_id', authUser.id)
      .single();

    let isLiked;

    if (existingLike) {
      // User already liked it - remove like
      const { error: deleteError } = await supabase
        .from('car_likes')
        .delete()
        .eq('car_id', carId)
        .eq('user_id', authUser.id);

      if (deleteError) {
        console.error("❌ Error removing like:", deleteError);
        throw deleteError;
      }

      isLiked = false;
      console.log("👎 Like removed");
    } else {
      // User hasn't liked it - add like
      const { error: insertError } = await supabase
        .from('car_likes')
        .insert({
          car_id: carId,
          user_id: authUser.id
        });

      if (insertError) {
        console.error("❌ Error adding like:", insertError);
        throw insertError;
      }

      isLiked = true;
      console.log("👍 Like added");
    }

    // 2. Get updated total likes count
    const { count } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId);

    const totalLikes = count || 0;

    // 3. Update car's total_likes field
    const { error: updateError } = await supabase
      .from('cars')
      .update({ total_likes: totalLikes })
      .eq('id', carId);

    if (updateError) {
      console.error("❌ Error updating car total_likes:", updateError);
      // Don't throw here - the like was still processed
    }

    const data = {
      success: true,
      isLiked,
      totalLikes,
      message: isLiked ? "Car liked!" : "Like removed"
    };

    console.log(`✅ SIMPLE: Like toggled - isLiked: ${isLiked}, totalLikes: ${totalLikes}`);

    // Car likes are displayed throughout the app (garage, profiles, clubs, homepage, my-pages, etc.)
    // We use a comprehensive revalidation strategy to ensure consistency everywhere
    console.log("🔄 Revalidating entire app due to car like change...");
    
    // Option 1: Revalidate all major cache tags
    revalidateTag("garage");
    revalidateTag("cars");
    revalidateTag("user-garage"); // This will invalidate ALL user garage caches
    revalidateTag(`car-${carId}`);
    revalidateTag("profile");
    revalidateTag("clubs");
    revalidateTag("user-clubs"); // This will invalidate ALL user club caches
    revalidateTag("home-data");
    revalidateTag("leaderboards");
    
    // Option 2: Revalidate from root layout (nuclear option - revalidates everything)
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      totalLikes: totalLikes,
      isLiked: isLiked,
      message: data.message,
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