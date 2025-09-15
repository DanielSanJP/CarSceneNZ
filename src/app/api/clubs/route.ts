// Simplified Clubs Gallery API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("🚀 FETCH CACHE: Fetching clubs gallery via direct queries...");

    const supabase = await createClient();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || null;
    const location = searchParams.get("location") || null;
    const club_type = searchParams.get("club_type") || null;
    const sortBy = searchParams.get("sortBy") || "likes";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const userId = searchParams.get("userId") || null;

    console.log(`🔍 DEBUG: Fetching clubs - Page ${page}, Limit ${limit}, Sort: ${sortBy}`);
    console.log(`🔍 DEBUG: Filters - Search: ${search}, Location: ${location}, Type: ${club_type}`);

    const offset = (page - 1) * limit;

    // Build the query dynamically with filters
    let query = supabase
      .from('clubs')
      .select(`
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
      `);

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply location filter
    if (location) {
      query = query.eq('location', location);
    }

    // Apply club type filter
    if (club_type) {
      query = query.eq('club_type', club_type);
    }

    // Apply sorting
    switch (sortBy) {
      case 'likes':
        query = query.order('total_likes', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('total_likes', { ascending: false });
    }

    // Get total count for pagination (with same filters)
    let countQuery = supabase
      .from('clubs')
      .select('*', { count: 'exact', head: true });

    // Apply same filters to count query
    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (location) {
      countQuery = countQuery.eq('location', location);
    }
    if (club_type) {
      countQuery = countQuery.eq('club_type', club_type);
    }

    const { count: totalCount } = await countQuery;

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clubs, error: clubsError } = await query;

    if (clubsError) {
      console.error("❌ Error fetching clubs:", clubsError);
      throw clubsError;
    }

    console.log(`🔍 DEBUG: Fetched ${clubs?.length || 0} clubs from database`);

    // Get member counts for all clubs in parallel
    const clubIds = clubs?.map(club => club.id) || [];
    const memberCounts: Record<string, number> = {};
    const userMemberships: Record<string, boolean> = {};

    if (clubIds.length > 0) {
      // Get member counts for all clubs
      const { data: memberCountData } = await supabase
        .from('club_members')
        .select('club_id')
        .in('club_id', clubIds);

      // Count members per club
      memberCountData?.forEach(member => {
        memberCounts[member.club_id] = (memberCounts[member.club_id] || 0) + 1;
      });

      // Get user memberships if userId is provided
      if (userId) {
        const { data: userMembershipData } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('user_id', userId)
          .in('club_id', clubIds);

        userMembershipData?.forEach(membership => {
          userMemberships[membership.club_id] = true;
        });
      }
    }

    // Transform clubs data to match interface
    const transformedClubs = clubs?.map(club => ({
      ...club,
      is_invite_only: club.club_type === 'invite', // Derive from club_type
      memberCount: memberCounts[club.id] || 0,
      isUserMember: userId ? userMemberships[club.id] || false : undefined
    })) || [];

    const totalPages = Math.ceil((totalCount || 0) / limit);

    const clubsGalleryData = {
      clubs: transformedClubs,
      pagination: {
        total: totalCount || 0,
        page: page,
        limit: limit,
        totalPages: totalPages,
      },
      filters: {
        search: search || "",
        location: location || "",
        club_type: club_type || "",
        sortBy: sortBy,
      },
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Clubs gallery data fetched and processed in ${endTime - startTime}ms`);
    console.log(`📊 Final data - Clubs: ${clubsGalleryData.clubs.length}, Total: ${clubsGalleryData.pagination.total}`);

    return NextResponse.json(clubsGalleryData);
  } catch (error) {
    console.error("❌ Error fetching clubs gallery data:", error);
    return NextResponse.json(
      { error: "Failed to fetch clubs gallery data" },
      { status: 500 }
    );
  }
}