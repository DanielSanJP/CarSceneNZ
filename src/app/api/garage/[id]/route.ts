import { NextRequest, NextResponse } from 'next/server';
import { getUserOptional } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export interface CarDetailData {
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    images: string[];
    total_likes: number;
    created_at: string;
    updated_at: string;
    owner_id: string;
    is_liked: boolean;
    owner: {
      id: string;
      username: string;
      display_name?: string;
      profile_image_url?: string;
    };
  };
  engine: {
    engine_code?: string;
    displacement?: string;
    aspiration?: string;
    power_hp?: number;
    torque_nm?: number;
    ecu?: string;
    tuned_by?: string;
    pistons?: string;
    connecting_rods?: string;
    valves?: string;
    valve_springs?: string;
    camshafts?: string;
    header?: string;
    exhaust?: string;
    intake?: string;
    turbo?: string;
    intercooler?: string;
    fuel_injectors?: string;
    fuel_pump?: string;
    fuel_rail?: string;
  };
  wheels: Array<{
    position: string;
    brand?: string;
    model?: string;
    size?: string;
    offset?: number;
    tire_brand?: string;
    tire_model?: string;
    tire_size?: string;
  }>;
  suspension: Array<{
    position?: string;
    suspension_type?: string;
    brand?: string;
    model?: string;
    spring_rate?: string;
    damping?: string;
    anti_roll_bar?: string;
    strut_brace?: string;
  }>;
  brakes: Array<{
    position: string;
    caliper_brand?: string;
    caliper_model?: string;
    rotor_brand?: string;
    rotor_model?: string;
    rotor_size?: string;
    pad_brand?: string;
    pad_model?: string;
  }>;
  exterior: {
    front_bumper?: string;
    front_lip?: string;
    rear_bumper?: string;
    rear_lip?: string;
    side_skirts?: string;
    rear_spoiler?: string;
    diffuser?: string;
    fender_flares?: string;
    hood?: string;
    paint_color?: string;
    paint_finish?: string;
    wrap_brand?: string;
    wrap_color?: string;
    headlights?: string;
    taillights?: string;
    fog_lights?: string;
    underglow?: string;
    interior_lighting?: string;
  };
  interior: {
    front_seats?: string;
    rear_seats?: string;
    steering_wheel?: string;
    head_unit?: string;
    speakers?: string;
    subwoofer?: string;
    amplifier?: string;
  };
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user if authenticated
    const user = await getUserOptional();
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Call RPC function for optimized car detail data
    const { data, error } = await supabase.rpc('get_car_detail_optimized', {
      car_id_param: id,
      user_id_param: user?.id || null,
    });

    if (error) {
      console.error('Error fetching car detail data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch car details' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    const carDetailData: CarDetailData = data;

    return NextResponse.json(carDetailData, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200', // 10 min cache, 20 min stale (car details change less frequently)
      },
    });
  } catch (error) {
    console.error('Error in car detail API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car details' },
      { status: 500 }
    );
  }
}
