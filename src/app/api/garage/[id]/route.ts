// Simplified Car Detail API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // Get userId from query params for GET request
    const startTime = Date.now();

    console.log(`🚀 FETCH CACHE: Fetching car ${id} details via direct queries...`);

    const supabase = await createClient();

    // Get car details with owner information
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .select(`
        *,
        owner:users!cars_owner_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('id', id)
      .single();
    
    if (carError || !carData) {
      console.error("❌ Error fetching car:", carError);
      if (carError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Car not found" },
          { status: 404 }
        );
      }
      throw carError;
    }

    console.log(`🔍 DEBUG: Found car: ${carData.brand} ${carData.model} (${carData.year})`);

    // Get like count
    const { count: likeCount } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', id);

    // Get user's like status if userId is provided
    let isLiked = false;
    if (userId) {
      const { data: likeData } = await supabase
        .from('car_likes')
        .select('id')
        .eq('car_id', id)
        .eq('user_id', userId)
        .single();

      isLiked = !!likeData;
    }

    // Transform owner data
    const owner = Array.isArray(carData.owner) ? carData.owner[0] : carData.owner;

    // Return nested structure that matches the CarDetailData interface
    const carDetailData = {
      car: {
        id: carData.id,
        owner_id: carData.owner_id,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        images: carData.images || [],
        total_likes: likeCount || 0,
        is_liked: isLiked,
        created_at: carData.created_at,
        updated_at: carData.updated_at,
        owner: owner ? {
          id: owner.id,
          username: owner.username,
          display_name: owner.display_name,
          profile_image_url: owner.profile_image_url
        } : null
      },
      engine: {
        engine_code: carData.engine_code,
        displacement: carData.displacement,
        aspiration: carData.aspiration,
        power_hp: carData.power_hp,
        torque_nm: carData.torque_nm,
        ecu: carData.ecu,
        tuned_by: carData.tuned_by,
        pistons: carData.pistons,
        connecting_rods: carData.connecting_rods,
        valves: carData.valves,
        valve_springs: carData.valve_springs,
        camshafts: carData.camshafts,
        header: carData.header,
        exhaust: carData.exhaust,
        intake: carData.intake,
        turbo: carData.turbo,
        intercooler: carData.intercooler,
        fuel_injectors: carData.fuel_injectors,
        fuel_pump: carData.fuel_pump,
        fuel_rail: carData.fuel_rail,
      },
      interior: {
        front_seats: carData.front_seats,
        rear_seats: carData.rear_seats,
        steering_wheel: carData.steering_wheel,
        head_unit: carData.head_unit,
        speakers: carData.speakers,
        subwoofer: carData.subwoofer,
        amplifier: carData.amplifier,
      },
      exterior: {
        front_bumper: carData.front_bumper,
        front_lip: carData.front_lip,
        rear_bumper: carData.rear_bumper,
        rear_lip: carData.rear_lip,
        side_skirts: carData.side_skirts,
        rear_spoiler: carData.rear_spoiler,
        diffuser: carData.diffuser,
        fender_flares: carData.fender_flares,
        hood: carData.hood,
        paint_color: carData.paint_color,
        paint_finish: carData.paint_finish,
        wrap_brand: carData.wrap_brand,
        wrap_color: carData.wrap_color,
        headlights: carData.headlights,
        taillights: carData.taillights,
        fog_lights: carData.fog_lights,
        underglow: carData.underglow,
        interior_lighting: carData.interior_lighting,
      },
      brakes: carData.brakes || {},
      suspension: carData.suspension || {},
      wheels: carData.wheels || {},
      gauges: Array.isArray(carData.gauges) ? carData.gauges : [],
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Car ${id} details fetched and processed in ${
        endTime - startTime
      }ms`
    );

    console.log(`📊 Final data - Car: ${carDetailData.car.brand} ${carDetailData.car.model}, Liked: ${carDetailData.car.is_liked}, Likes: ${carDetailData.car.total_likes}`);

    return NextResponse.json(carDetailData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error("❌ Error fetching car details:", error);
    return NextResponse.json(
      { error: "Failed to load car details" },
      { status: 500 }
    );
  }
}