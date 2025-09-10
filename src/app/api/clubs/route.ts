import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export interface ClubsGalleryData {
  clubs: Array<{
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
    memberCount: number;
  }>;
  totalCount: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const search = searchParams.get('search') || null;
    const location = searchParams.get('location') || null;
    const club_type = searchParams.get('club_type') || null;
    const sortBy = searchParams.get('sortBy') || 'likes';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const offset = (page - 1) * limit;

    const supabase = await createClient();
    
    // Call RPC function for optimized clubs gallery data
    const { data, error } = await supabase.rpc('get_clubs_gallery', {
      search_term: search,
      location_filter: location,
      club_type_filter: club_type,
      sort_by: sortBy,
      result_limit: limit,
      result_offset: offset
    });

    if (error) {
      console.error('Error fetching clubs gallery data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clubs data' },
        { status: 500 }
      );
    }

    const response: ClubsGalleryData = {
      clubs: data?.clubs || [],
      totalCount: data?.totalCount || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: data?.meta?.cache_key || `clubs_gallery_${page}_${limit}`
      }
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 2 minutes - clubs data changes with member activity
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, max-age=240'
      }
    });

  } catch (error) {
    console.error('Error in clubs gallery API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
