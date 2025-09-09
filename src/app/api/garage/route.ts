import { NextRequest, NextResponse } from 'next/server';
import { getUserOptional } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export interface GarageGalleryData {
  cars: Array<{
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
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    // Get user if authenticated
    const user = await getUserOptional();
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Call RPC function for optimized garage gallery data
    const { data, error } = await supabase.rpc('get_garage_gallery_optimized', {
      page_num: page,
      page_limit: limit,
      user_id_param: user?.id || null,
    });

    if (error) {
      console.error('Error fetching garage gallery data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch garage data' },
        { status: 500 }
      );
    }

    const garageData: GarageGalleryData = data;

    // Add current user to the response structure to match hook expectations
    const responseData = {
      cars: garageData.cars,
      currentUser: user,
      pagination: garageData.pagination,
      meta: garageData.meta,
    };

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
      },
    });
  } catch (error) {
    console.error('Error in garage API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch garage data' },
      { status: 500 }
    );
  }
}
