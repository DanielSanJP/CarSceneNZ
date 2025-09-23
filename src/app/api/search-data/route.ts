import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET() {
  try {
    console.log(`🔍 Search Data API: Fetching all searchable data...`);

    const supabase = await createClient();

    // Fetch cars (public data only) with cache tag
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
      .limit(1000); // Reasonable limit for search

    if (carsError) {
      console.error('Error fetching cars for search:', carsError);
    }

    // Fetch users (public profiles only)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, display_name, profile_image_url')
      .limit(1000);

    if (usersError) {
      console.error('Error fetching users for search:', usersError);
    }

    // Fetch events (public events only)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        location,
        daily_schedule,
        created_at,
        host:users!events_host_id_fkey(
          id,
          username,
          display_name
        )
      `)
      .limit(1000);

    if (eventsError) {
      console.error('Error fetching events for search:', eventsError);
    }

    // Fetch clubs (public clubs)
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
      .limit(1000);

    if (clubsError) {
      console.error('Error fetching clubs for search:', clubsError);
    }

    const searchData = {
      cars: cars || [],
      users: users || [],
      events: events || [],
      clubs: clubs || [],
    };

    console.log(`✅ Search Data API: Fetched ${searchData.cars.length} cars, ${searchData.users.length} users, ${searchData.events.length} events, ${searchData.clubs.length} clubs`);

    return NextResponse.json(searchData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Error in search data API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}