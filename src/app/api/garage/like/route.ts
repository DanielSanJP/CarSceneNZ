import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export interface CarLikeResponse {
  success: boolean;
  action: 'liked' | 'unliked';
  new_like_count: number;
  is_liked: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (required for liking)
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { carId } = body;

    if (!carId) {
      return NextResponse.json(
        { error: 'Car ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    
    // Call RPC function for optimized like toggle
    const { data, error } = await supabase.rpc('toggle_car_like_optimized', {
      car_id_param: carId,
      user_id_param: user.id,
    });

    if (error) {
      console.error('Error toggling car like:', error);
      return NextResponse.json(
        { error: 'Failed to update like status' },
        { status: 500 }
      );
    }

    const likeResponse: CarLikeResponse = data;

    return NextResponse.json(likeResponse, {
      headers: {
        'Cache-Control': 'no-cache', // Don't cache like actions
      },
    });
  } catch (error) {
    console.error('Error in car like API route:', error);
    return NextResponse.json(
      { error: 'Failed to update like status' },
      { status: 500 }
    );
  }
}
