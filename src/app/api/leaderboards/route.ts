import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export interface LeaderboardsData {
  cars: Array<{
    car: {
      id: string;
      owner_id: string;
      brand: string;
      model: string;
      year: number;
      images: string[];
      total_likes: number;
      created_at: string;
      updated_at: string;
      owner: {
        id: string;
        username: string;
        display_name: string;
        profile_image_url?: string;
      };
    };
    rank: number;
    likes: number;
  }>;
  owners: Array<{
    owner: {
      id: string;
      username: string;
      display_name: string;
      email: string;
      profile_image_url?: string;
      created_at: string;
      updated_at: string;
    };
    rank: number;
    totalLikes: number;
    carCount: number;
  }>;
  clubs: Array<{
    club: {
      id: string;
      name: string;
      description: string;
      banner_image_url?: string;
      club_type: string;
      location?: string;
      leader_id: string;
      total_likes: number;
      created_at: string;
      updated_at: string;
      leader: {
        id: string;
        username: string;
        display_name: string;
        profile_image_url?: string;
      };
    };
    rank: number;
    likes: number;
    memberCount: number;
  }>;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const limit = 200; // Top 200 in each category
    
    // Call all three RPC functions in parallel for maximum efficiency
    const [
      { data: carsData, error: carsError },
      { data: ownersData, error: ownersError },
      { data: clubsData, error: clubsError }
    ] = await Promise.all([
      supabase.rpc('get_top_cars', { result_limit: limit }),
      supabase.rpc('get_top_owners', { result_limit: limit }),
      supabase.rpc('get_top_clubs', { result_limit: limit })
    ]);

    if (carsError || ownersError || clubsError) {
      console.error('Error fetching leaderboards data:', {
        carsError,
        ownersError,
        clubsError
      });
      return NextResponse.json(
        { error: 'Failed to fetch leaderboards data' },
        { status: 500 }
      );
    }

    const response: LeaderboardsData = {
      cars: carsData?.cars || [],
      owners: ownersData?.owners || [],
      clubs: clubsData?.clubs || [],
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `leaderboards_${limit}`
      }
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 5 minutes - leaderboards don't change that frequently
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, max-age=600'
      }
    });

  } catch (error) {
    console.error('Error in leaderboards API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
