// Simplified User Leader Clubs API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const startTime = Date.now();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 FETCH CACHE: Fetching leader clubs for user ${userId} via direct queries...`);

    const supabase = await createClient();

    // Get clubs where user is the leader - simple query!
    const { data: leaderClubs, error: clubsError } = await supabase
      .from('clubs')
      .select(`
        id,
        name,
        description,
        banner_image_url,
        club_type,
        location,
        total_likes,
        created_at,
        updated_at
      `)
      .eq('leader_id', userId)
      .order('created_at', { ascending: false });

    if (clubsError) {
      console.error("❌ Error fetching leader clubs:", clubsError);
      throw clubsError;
    }

    console.log(`🔍 DEBUG: Found ${leaderClubs?.length || 0} clubs where user is leader`);

    // Get member counts for these clubs
    const clubIds = leaderClubs?.map(club => club.id) || [];
    const memberCounts: Record<string, number> = {};

    if (clubIds.length > 0) {
      const { data: memberCountData } = await supabase
        .from('club_members')
        .select('club_id')
        .in('club_id', clubIds);

      // Count members per club
      memberCountData?.forEach(member => {
        memberCounts[member.club_id] = (memberCounts[member.club_id] || 0) + 1;
      });
    }

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} leader clubs fetched and processed in ${endTime - startTime}ms`);

    // Format response to match expected LeaderClubsData interface
    const formattedResponse = {
      leaderClubs: leaderClubs?.map(club => ({
        id: club.id,
        name: club.name,
        description: club.description,
        image_url: club.banner_image_url,
        memberCount: memberCounts[club.id] || 0,
      })) || [],
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `leader_clubs_${userId}_${Date.now()}`,
      },
    };

    console.log(`📊 Final data - Leader clubs: ${formattedResponse.leaderClubs.length}`);

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("❌ Error fetching leader clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch leader clubs" },
      { status: 500 }
    );
  }
}