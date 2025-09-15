import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body?.userId || null;
    const startTime = Date.now();

    console.log(`🚀 SIMPLE: Fetching club ${id} detail using direct queries...`);

    const supabase = await createClient();

    // 1. Get club basic info
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single();

    if (clubError || !club) {
      console.error("❌ Club not found:", clubError);
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // 2. Get club leader info
    const { data: leader } = await supabase
      .from('users')
      .select('id, username, display_name, profile_image_url')
      .eq('id', club.leader_id)
      .single();

    // 3. Get members
    const { data: members, error: membersError } = await supabase
      .from('club_members')
      .select('user_id, role, joined_at')
      .eq('club_id', id);

    if (membersError) {
      console.error("❌ Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // 4. Get user info for each member and their car stats
    const membersWithStats = await Promise.all(
      (members || []).map(async (member) => {
        // Get user info
        const { data: user } = await supabase
          .from('users')
          .select('id, username, display_name, profile_image_url')
          .eq('id', member.user_id)
          .single();

        // Get car stats
        const { data: carStats } = await supabase
          .from('cars')
          .select('id, total_likes, brand, model')
          .eq('owner_id', member.user_id);

        const totalCars = carStats?.length || 0;
        const totalLikes = carStats?.reduce((sum, car) => sum + (car.total_likes || 0), 0) || 0;
        
        // Find most liked car - handle empty array case
        const mostLikedCar = (carStats && carStats.length > 0) ? carStats.reduce((prev, current) => 
          (current.total_likes > (prev?.total_likes || 0)) ? current : prev
        ) : null;

        return {
          user: user || {
            id: member.user_id,
            username: 'Unknown',
            display_name: 'Unknown User',
            profile_image_url: null
          },
          role: member.role,
          joined_at: member.joined_at,
          total_cars: totalCars,
          total_likes: totalLikes,
          most_liked_car_brand: mostLikedCar?.brand || null,
          most_liked_car_model: mostLikedCar?.model || null,
          most_liked_car_likes: mostLikedCar?.total_likes || 0,
        };
      })
    );

    // 5. Check if current user is a member
    const isUserMember = userId ? 
      members.some(member => member.user_id === userId) : false;

    // 6. Build response
    const clubDetailData = {
      club: {
        ...club,
        leader,
        isUserMember
      },
      members: membersWithStats,
      memberCount: membersWithStats.length,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `club_detail_${id}_${userId || 'anon'}`
      }
    };

    const endTime = Date.now();
    console.log(`✅ SIMPLE: Club ${id} detail fetched in ${endTime - startTime}ms`);
    console.log(`🔍 DEBUG: User ${userId} membership status: ${isUserMember}`);
    console.log(`🔍 DEBUG: Members count: ${membersWithStats.length}`);

    return NextResponse.json(clubDetailData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=1800',
      },
    });

  } catch (error) {
    console.error("❌ Error fetching club detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch club detail data" },
      { status: 500 }
    );
  }
}