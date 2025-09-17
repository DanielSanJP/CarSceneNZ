// Simplified User Clubs API - Direct queries instead of RPC

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

    console.log(`🚀 FETCH CACHE: Fetching my clubs for user ${userId} via direct queries...`);

    const supabase = await createClient();

    // Get user's club memberships first
    const { data: userMemberships, error: membershipsError } = await supabase
      .from('club_members')
      .select('club_id, role, joined_at')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (membershipsError) {
      console.error("❌ Error fetching user memberships:", membershipsError);
      throw membershipsError;
    }

    if (!userMemberships || userMemberships.length === 0) {
      console.log(`📋 User ${userId} is not a member of any clubs`);
      const myClubsData = {
        clubs: [],
        meta: {
          total: 0,
          generated_at: new Date().toISOString(),
          cache_key: `my_clubs_${userId}`
        }
      };

      return NextResponse.json(myClubsData);
    }

    // Get club details from club_stats view for accurate total_likes
    const clubIds = userMemberships.map(m => m.club_id);
    const { data: clubs, error: clubsError } = await supabase
      .from('club_stats')
      .select('*')
      .in('id', clubIds);

    if (clubsError) {
      console.error("❌ Error fetching club details:", clubsError);
      throw clubsError;
    }

    // Get leader info for all clubs
    const leaderIds = clubs?.map(club => club.leader_id) || [];
    const leadersMap: Record<string, { id: string; username: string; display_name?: string; profile_image_url?: string }> = {};

    if (leaderIds.length > 0) {
      const { data: leaders } = await supabase
        .from('users')
        .select('id, username, display_name, profile_image_url')
        .in('id', leaderIds);

      leaders?.forEach(leader => {
        leadersMap[leader.id] = leader;
      });
    }

    // Transform data to match UserClubsData interface
    const userClubsData = {
      clubs: userMemberships?.map(membership => {
        const club = clubs?.find(c => c.id === membership.club_id);
        const leader = leadersMap[club?.leader_id || ''];
        
        return {
          club: {
            id: club?.id,
            name: club?.name,
            description: club?.description,
            banner_image_url: club?.banner_image_url,
            club_type: club?.club_type,
            location: club?.location,
            leader_id: club?.leader_id,
            total_likes: club?.calculated_total_likes || 0, // Use calculated value from view
            is_invite_only: club?.club_type === 'invite',
            created_at: club?.created_at,
            updated_at: club?.updated_at,
            leader: leader ? {
              id: leader.id,
              username: leader.username,
              display_name: leader.display_name,
              profile_image_url: leader.profile_image_url
            } : undefined
          },
          role: membership.role,
          joined_at: membership.joined_at,
          memberCount: club?.member_count || 0, // Use pre-calculated member count from view
        };
      }).filter(item => item.club.id) || [], // Filter out any clubs that weren't found
      meta: {
        total: userMemberships?.length || 0,
        generated_at: new Date().toISOString(),
        cache_key: `my_clubs_${userId}`
      }
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} clubs fetched and processed in ${endTime - startTime}ms`);
    console.log(`📊 Final data - User clubs: ${userClubsData.meta.total}`);

    return NextResponse.json(userClubsData);
  } catch (error) {
    console.error("❌ Error fetching user clubs data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user clubs data" },
      { status: 500 }
    );
  }
}