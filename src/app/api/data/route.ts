import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch data from Supabase
    const [usersRes, carsRes, eventsRes, clubsRes, carLikesRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('cars').select('*'),
      supabase.from('events').select('*'),
      supabase.from('clubs').select('*'),
      supabase.from('car_likes').select('*'),
    ]);

    if (usersRes.error || carsRes.error || eventsRes.error || clubsRes.error || carLikesRes.error) {
      console.error('Supabase errors:', {
        users: usersRes.error,
        cars: carsRes.error,
        events: eventsRes.error,
        clubs: clubsRes.error,
        carLikes: carLikesRes.error,
      });
      return NextResponse.json(
        { error: 'Failed to fetch data from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: usersRes.data,
      cars: carsRes.data,
      events: eventsRes.data,
      clubs: clubsRes.data,
      carLikes: carLikesRes.data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}