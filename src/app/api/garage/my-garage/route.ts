import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export interface UserGarageData {
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
  }>;
  total: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export async function GET() {
  try {
    // Get authenticated user (required for my garage)
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    
    // Call RPC function for optimized user garage data
    const { data, error } = await supabase.rpc('get_user_garage_optimized', {
      user_id_param: user.id,
    });

    if (error) {
      console.error('Error fetching user garage data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch garage data' },
        { status: 500 }
      );
    }

    const userGarageData: UserGarageData = data;

    return NextResponse.json(userGarageData, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300', // 1 min cache, 5 min stale (user's own data)
      },
    });
  } catch (error) {
    console.error('Error in my garage API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch garage data' },
      { status: 500 }
    );
  }
}
