// Simplified Profile Data API - Direct queries instead of RPC

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/utils/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id: usernameOrId } = await context.params;
    const currentUserId = body?.currentUserId;
    const startTime = Date.now();

    if (!usernameOrId) {
      return NextResponse.json(
        { error: "Username or ID is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 FETCH CACHE: Fetching profile data for ${usernameOrId} via direct queries...`);

    const supabase = await createClient();

    // Check if the input looks like a UUID (36 characters with hyphens)
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        usernameOrId
      );

    // Get user profile data
    let userQuery = supabase
      .from('users')
      .select(`
        id,
        username,
        display_name,
        profile_image_url,
        instagram_url,
        facebook_url,
        tiktok_url,
        created_at,
        updated_at
      `);

    if (isUUID) {
      userQuery = userQuery.eq('id', usernameOrId);
    } else {
      userQuery = userQuery.eq('username', usernameOrId);
    }

    const { data: userData, error: userError } = await userQuery.single();

    if (userError || !userData) {
      console.error("❌ Error fetching user:", userError);
      if (userError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      throw userError;
    }

    console.log(`🔍 DEBUG: Found user: ${userData.username}`);

    // Get user statistics in parallel
    const [
      { count: carCount },
      { count: clubsMemberCount },
      { count: eventsAttendedCount },
      { count: followersCount },
      { count: followingCount }
    ] = await Promise.all([
      // Car count
      supabase
        .from('cars')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userData.id),
      
      // Clubs member count
      supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id),
      
      // Events attended count
      supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userData.id),
      
      // Followers count
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userData.id),
      
      // Following count
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userData.id)
    ]);

    // Check if current user is following this profile user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userData.id) {
      const { data: followData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userData.id)
        .single();

      isFollowing = !!followData;
    }

    // Get user's cars
    const { data: userCars, error: carsError } = await supabase
      .from('cars')
      .select(`
        id,
        brand,
        model,
        year,
        images,
        total_likes,
        created_at,
        updated_at
      `)
      .eq('owner_id', userData.id)
      .order('created_at', { ascending: false });

    if (carsError) {
      console.error("❌ Error fetching user cars:", carsError);
      // Don't throw - just return empty cars array
    }

    // Get user's clubs with leader info
    const { data: userClubMemberships, error: clubsError } = await supabase
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
      .eq('user_id', userData.id);

    if (clubsError) {
      console.error("❌ Error fetching user clubs:", clubsError);
    }

    // Get member counts for each club
    const userClubs = await Promise.all(
      (userClubMemberships || []).map(async (membership) => {
        const club = Array.isArray(membership.club) ? membership.club[0] : membership.club;
        const leader = Array.isArray(club?.leader) ? club.leader[0] : club?.leader;
        
        // Get member count for this club
        const { count: memberCount } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club?.id);

        return {
          club: {
            ...club,
            leader: leader
          },
          role: membership.role,
          joined_at: membership.joined_at,
          memberCount: memberCount || 0
        };
      })
    );

    // Get followers
    const { data: followersData, error: followersError } = await supabase
      .from('user_follows')
      .select(`
        follower:users!user_follows_follower_id_fkey(
          id,
          username,
          display_name,
          profile_image_url,
          created_at,
          updated_at
        )
      `)
      .eq('following_id', userData.id);

    if (followersError) {
      console.error("❌ Error fetching followers:", followersError);
    }

    // Get following
    const { data: followingData, error: followingError } = await supabase
      .from('user_follows')
      .select(`
        following:users!user_follows_following_id_fkey(
          id,
          username,
          display_name,
          profile_image_url,
          created_at,
          updated_at
        )
      `)
      .eq('follower_id', userData.id);

    if (followingError) {
      console.error("❌ Error fetching following:", followingError);
    }

    // Build profile data to match the original RPC structure exactly
    const profileData = {
      profileUser: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        profile_image_url: userData.profile_image_url,
        instagram_url: userData.instagram_url,
        facebook_url: userData.facebook_url,
        tiktok_url: userData.tiktok_url,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        carsCount: carCount || 0,
        clubsCount: clubsMemberCount || 0,
        eventsCount: eventsAttendedCount || 0
      },
      userCars: (userCars || []).map(car => ({
        id: car.id,
        user_id: userData.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        image_url: car.images && car.images.length > 0 ? car.images[0] : null,
        total_likes: car.total_likes,
        created_at: car.created_at,
        updated_at: car.updated_at
      })),
      followers: (followersData || []).map(f => {
        const follower = Array.isArray(f.follower) ? f.follower[0] : f.follower;
        return follower;
      }),
      following: (followingData || []).map(f => {
        const following = Array.isArray(f.following) ? f.following[0] : f.following;
        return following;
      }),
      userClubs: userClubs,
      isFollowing: isFollowing,
      currentUser: currentUserId ? {
        id: currentUserId,
        username: '',
        display_name: '',
        created_at: '',
        updated_at: ''
      } : null
    };

    const endTime = Date.now();
    console.log(`✅ FETCH CACHE: Profile ${usernameOrId} data fetched and processed in ${endTime - startTime}ms`);

    console.log(`📊 Final data - User: ${profileData.profileUser.username}, Cars: ${profileData.profileUser.carsCount}, Followers: ${profileData.profileUser.followersCount}`);

    console.log(`🔍 DEBUG: API Response structure:`, {
      hasProfileData: !!profileData,
      hasProfileUser: !!profileData.profileUser,
      profileUserId: profileData.profileUser?.id,
      userCarsCount: profileData.userCars?.length,
      actualKeys: Object.keys(profileData)
    });

    console.log(`🔍 DEBUG: Raw profileData object:`, JSON.stringify(profileData, null, 2));

    // Format response to match expected interface
    const formattedResponse = {
      profileData,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `profile_${usernameOrId}_${currentUserId || 'public'}_${Date.now()}`,
      },
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("❌ Error fetching profile data:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile data" },
      { status: 500 }
    );
  }
}