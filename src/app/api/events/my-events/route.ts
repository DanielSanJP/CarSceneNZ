import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

export interface UserEventsData {
  events: Array<{
    id: string;
    host_id: string;
    title: string;
    description: string;
    poster_image_url: string;
    daily_schedule: unknown;
    location: string;
    created_at: string;
    updated_at: string;
    attendee_count: number;
    interested_count: number;
  }>;
  total: number;
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export async function GET() {
  try {
    // Get authenticated user (required for my events)
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    
    // Call RPC function for optimized user events data
    const { data, error } = await supabase.rpc('get_user_events_optimized', {
      user_id_param: user.id,
    });

    if (error) {
      console.error('Error fetching user events data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch events data' },
        { status: 500 }
      );
    }

    const userEventsData: UserEventsData = data;

    return NextResponse.json(userEventsData, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300', // 1 min cache, 5 min stale (user's own data)
      },
    });
  } catch (error) {
    console.error('Error in my events API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events data' },
      { status: 500 }
    );
  }
}
