import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        cars: [],
        users: [],
        events: [],
        clubs: [],
        total: 0,
      });
    }

    const searchTerm = query.trim().toLowerCase();
    console.log(`🔍 Search API: Searching for "${searchTerm}"`);

    const supabase = await createClient();

    // Search cars (public data only)
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select(`
        id,
        brand,
        model,
        year,
        images,
        owner:users!cars_owner_id_fkey(
          id,
          username,
          display_name
        )
      `)
      .or(`brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,year.eq.${searchTerm}`)
      .limit(20);

    if (carsError) {
      console.error('Error searching cars:', carsError);
    }

    // Search users (public profiles only)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, display_name, profile_image_url')
      .ilike('username', `%${searchTerm}%`)
      .limit(20);

    if (usersError) {
      console.error('Error searching users:', usersError);
    }

    // Search events (public events only)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        daily_schedule,
        host:users!events_host_id_fkey(
          id,
          username,
          display_name
        )
      `)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
      .limit(20);

    if (eventsError) {
      console.error('Error searching events:', eventsError);
    }

    // Search clubs (public clubs or open clubs)
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select(`
        id,
        name,
        description,
        club_type,
        banner_image_url,
        leader_id
      `)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(20);

    if (clubsError) {
      console.error('Error searching clubs:', clubsError);
    }

    const results = {
      cars: cars || [],
      users: users || [],
      events: events || [],
      clubs: clubs || [],
    };

    console.log(`✅ Search API: Found ${(cars?.length || 0) + (users?.length || 0) + (events?.length || 0) + (clubs?.length || 0)} results for "${searchTerm}"`);

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });

  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}