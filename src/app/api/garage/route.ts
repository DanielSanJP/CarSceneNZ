// Simplified Garage Gallery API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, limit, userId } = body;
    const startTime = Date.now();

    console.log(`🚀 FETCH CACHE: Fetching garage page ${page} via direct queries...`);

    const supabase = await createClient();

    const offset = (page - 1) * limit;

    // Get cars with owner information using direct query
    const { data: cars, error: carsError } = await supabase
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
        owner_id,
        owner:users!cars_owner_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (carsError) {
      console.error("❌ Error fetching cars:", carsError);
      throw carsError;
    }

    console.log(`🔍 DEBUG: Fetched ${cars?.length || 0} cars from database`);

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });

    // Get user's like status for each car if userId is provided
    const userLikes: Record<string, boolean> = {};
    if (userId && cars && cars.length > 0) {
      const carIds = cars.map(car => car.id);
      const { data: likesData } = await supabase
        .from('car_likes')
        .select('car_id')
        .eq('user_id', userId)
        .in('car_id', carIds);

      likesData?.forEach(like => {
        userLikes[like.car_id] = true;
      });
    }

    // Transform cars data to match interface
    const transformedCars = cars?.map(car => {
      const owner = Array.isArray(car.owner) ? car.owner[0] : car.owner;
      return {
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        images: car.images || [],
        total_likes: car.total_likes,
        created_at: car.created_at,
        updated_at: car.updated_at,
        owner_id: car.owner_id,
        is_liked: userId ? userLikes[car.id] || false : false,
        owner: owner ? {
          id: owner.id,
          username: owner.username,
          display_name: owner.display_name,
          profile_image_url: owner.profile_image_url
        } : null
      };
    }) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasMore = page < totalPages;

    const garageData = {
      cars: transformedCars,
      currentUser: null, // This could be populated if needed
      pagination: {
        page: page,
        limit: limit,
        total: totalCount || 0,
        totalPages: totalPages,
        hasMore: hasMore,
      },
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `garage_${page}_${limit}_${Date.now()}`,
      },
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Garage page ${page} fetched and processed in ${
        endTime - startTime
      }ms`
    );

    console.log(`📊 Final data - Cars: ${garageData.cars.length}, Total: ${garageData.pagination.total}`);

    return NextResponse.json({
      cars: garageData.cars,
      pagination: garageData.pagination,
      meta: garageData.meta,
    });
  } catch (error) {
    console.error("❌ Error fetching garage data:", error);
    return NextResponse.json(
      { error: "Failed to load garage data" },
      { status: 500 }
    );
  }
}