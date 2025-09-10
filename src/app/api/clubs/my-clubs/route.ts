import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export interface UserClubsData {
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
    role: string;
    joined_at: string;
    memberCount: number;
  }>;
  total: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export async function GET() {
  try {
    // Get authenticated user (required for user clubs)
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    
    // Call RPC function for optimized user clubs data
    const { data, error } = await supabase.rpc('get_user_clubs', {
      user_id_param: user.id,
    });

    if (error) {
      console.error('Error fetching user clubs data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user clubs data' },
        { status: 500 }
      );
    }

    const response: UserClubsData = {
      clubs: data?.clubs || [],
      total: data?.total || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: data?.meta?.cache_key || `user_clubs_${user.id}`
      }
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 1 minute - user club memberships can change
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=180',
        'CDN-Cache-Control': 'public, max-age=120'
      }
    });

  } catch (error) {
    console.error('Error in user clubs API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
