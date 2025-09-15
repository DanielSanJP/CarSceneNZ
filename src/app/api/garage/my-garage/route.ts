// Simplified User Garage API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const startTime = Date.now();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 FETCH CACHE: Fetching my garage for user ${userId} via direct queries...`);

    const supabase = await createClient();

    // Get user's cars - simple query!
    const { data: userCars, error: carsError } = await supabase
      .from('cars')
      .select(`
        id,
        brand,
        model,
        year,
        images,
        total_likes,
        created_at,
        updated_at,
        owner_id
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (carsError) {
      console.error("❌ Error fetching user cars:", carsError);
      throw carsError;
    }

    console.log(`🔍 DEBUG: Found ${userCars?.length || 0} cars for user ${userId}`);

    const userGarageData = {
      cars: userCars?.map(car => ({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        images: car.images || [],
        total_likes: car.total_likes,
        created_at: car.created_at,
        updated_at: car.updated_at,
        owner_id: car.owner_id,
      })) || [],
      total: userCars?.length || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `user_garage_${userId}_${Date.now()}`,
      },
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} garage fetched and processed in ${endTime - startTime}ms`);
    console.log(`📊 Final data - User cars: ${userGarageData.total}`);

    return NextResponse.json(userGarageData);
  } catch (error) {
    console.error("❌ Error fetching user garage data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user garage data" },
      { status: 500 }
    );
  }
}