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

    // Get user's club memberships with club data - join query
    const { data: userMemberships, error: membershipsError } = await supabase
      .from('club_members')
      .select(`
        role,
        joined_at,
        club:clubs!club_members_club_id_fkey(
          id,
          name,
          description,
          banner_image_url,
          club_type,
          location,
          leader_id,
          total_likes,
          created_at,
          updated_at,
          leader:users!clubs_leader_id_fkey(
            id,
            username,
            display_name,
            profile_image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (membershipsError) {
      console.error("❌ Error fetching user memberships:", membershipsError);
      throw membershipsError;
    }

    console.log(`🔍 DEBUG: Found ${userMemberships?.length || 0} club memberships for user ${userId}`);

    // Get member counts for all clubs
    const clubIds = userMemberships?.map(membership => {
      const club = membership.club as unknown as { id: string };
      return club?.id;
    }).filter(Boolean) || [];
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

    // Transform data to match UserClubsData interface
    const userClubsData = {
      clubs: userMemberships?.map(membership => {
        const club = membership.club as unknown as {
          id: string;
          name: string;
          description?: string;
          banner_image_url?: string;
          club_type?: string;
          location?: string;
          leader_id: string;
          total_likes: number;
          created_at: string;
          updated_at: string;
          leader?: { id: string; username: string; display_name?: string; profile_image_url?: string };
        };
        const leader = Array.isArray(club?.leader) ? club.leader[0] : club?.leader;
        
        return {
          club: {
            id: club?.id,
            name: club?.name,
            description: club?.description,
            banner_image_url: club?.banner_image_url,
            club_type: club?.club_type,
            location: club?.location,
            leader_id: club?.leader_id,
            total_likes: club?.total_likes || 0,
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
          memberCount: memberCounts[club?.id] || 0
        };
      }) || [],
      total: userMemberships?.length || 0,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `user_clubs_${userId}_${Date.now()}`,
      },
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: User ${userId} clubs fetched and processed in ${endTime - startTime}ms`);
    console.log(`📊 Final data - User clubs: ${userClubsData.total}`);

    return NextResponse.json(userClubsData);
  } catch (error) {
    console.error("❌ Error fetching user clubs data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user clubs data" },
      { status: 500 }
    );
  }
}