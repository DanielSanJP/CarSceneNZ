import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import type { Event } from '@/types/event';
import type { Car } from '@/types/car';
import type { User } from '@/types/user';

// Extended types for home page data
interface HomeEvent extends Event {
  host?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  attendeeCount?: number;
  interestedCount?: number;
}

interface HomeCar extends Car {
  owner?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

interface HomeClub {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  leader_id: string;
  leader?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  member_count?: number;
}

interface HomeUser extends User {
  car_count?: number;
  followers_count?: number;
}

// Home page data interface
interface HomeDataRPCResult {
  events: HomeEvent[];
  cars: HomeCar[];
  clubs: HomeClub[];
  users: HomeUser[];
  stats: {
    total_events: number;
    total_cars: number;
    total_clubs: number;
    total_users: number;
  };
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Response headers for aggressive caching
const getCacheHeaders = () => ({
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5min cache, 10min stale
  'CDN-Cache-Control': 'public, s-maxage=300',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
});

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all home page data in a single RPC call
    const { data: homeData, error } = await supabase
      .rpc('get_home_data_optimized')
      .single();

    if (error) {
      console.error('Error fetching home data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch home page data' },
        { status: 500 }
      );
    }

    if (!homeData) {
      return NextResponse.json(
        { error: 'No home page data found' },
        { status: 404 }
      );
    }

    // Type the result properly
    const result = homeData as HomeDataRPCResult;

    return NextResponse.json(result, {
      status: 200,
      headers: getCacheHeaders(),
    });

  } catch (error) {
    console.error('Unexpected error in home API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...getCacheHeaders(),
    },
  });
}
