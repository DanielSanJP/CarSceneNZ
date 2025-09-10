import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export interface ClubDetailData {
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
  members: Array<{
    user: {
      id: string;
      username: string;
      display_name: string;
      profile_image_url?: string;
    };
    role: string;
    joined_at: string;
    total_cars: number;
    total_likes: number;
    most_liked_car_brand?: string;
    most_liked_car_model?: string;
    most_liked_car_likes: number;
  }>;
  memberCount: number;
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
    
    const supabase = await createClient();
    
    // Use the comprehensive RPC function that returns all needed data
    const { data: clubDetailResult, error: clubError } = await supabase.rpc('get_club_detail', {
      club_id_param: id,
    });

    if (clubError) {
      console.error('Error fetching club detail data:', clubError);
      return NextResponse.json(
        { error: 'Failed to fetch club details' },
        { status: 500 }
      );
    }

    if (!clubDetailResult) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // The RPC returns the complete structure we need
    const response: ClubDetailData = {
      club: clubDetailResult.club,
      members: clubDetailResult.members || [],
      memberCount: clubDetailResult.memberCount || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `club_detail_${id}`
      }
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 3 minutes - club details don't change very frequently
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
        'CDN-Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    console.error('Error in club detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
