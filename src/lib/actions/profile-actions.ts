"use server";

import { createClient } from "@/lib/utils/supabase/server";
import type { ProfileData, LeaderClubsData } from "@/types/user";

/**
 * Get comprehensive profile data for a user by username or ID
 * This replaces the complex profile/[id] API route
 */
export async function getProfileData(
  usernameOrId: string,
  currentUserId?: string
): Promise<ProfileData> {
  const supabase = await createClient();

  try {
    // Check if the input looks like a UUID (36 characters with hyphens)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);

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
      throw new Error("User not found");
    }

    // Get user statistics in parallel
    const [
      { count: carCount, error: carCountError },
      { count: clubsMemberCount, error: clubsMemberCountError },
      { count: eventsAttendedCount, error: eventsAttendedCountError },
      { count: followersCount, error: followersCountError },
      { count: followingCount, error: followingCountError }
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
      
      // Followers count (people who follow this user)
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('following_id', userData.id),
      
      // Following count (people this user follows)
      supabase
        .from('user_follows')
        .select('id', { count: 'exact', head: true })
        .eq('follower_id', userData.id)
    ]);

    // Check if current user is following this profile user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userData.id) {
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userData.id)
        .single();

      if (followError && followError.code !== 'PGRST116') {
        console.error('Error checking follow status:', followError);
      }
      
      isFollowing = !!followData;
    }

    // Log any count errors
    if (carCountError) console.error('Car count error:', carCountError);
    if (clubsMemberCountError) console.error('Clubs member count error:', clubsMemberCountError);
    if (eventsAttendedCountError) console.error('Events attended count error:', eventsAttendedCountError);
    if (followersCountError) console.error('Followers count error:', followersCountError);
    if (followingCountError) console.error('Following count error:', followingCountError);



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
    }

    // Get user's clubs with leader info
    const { data: userClubMemberships, error: clubsError } = await supabase
      .from('club_members')
      .select(`
        role,
        joined_at,
        clubs (
          id,
          name,
          description,
          banner_image_url,
          club_type,
          location,
          total_likes,
          created_at,
          updated_at,
          leader_id,
          leader:users!clubs_leader_id_fkey (
            id,
            username,
            display_name,
            profile_image_url
          )
        )
      `)
      .eq('user_id', userData.id)
      .order('joined_at', { ascending: false });

    if (clubsError) {
      console.error("❌ Error fetching user clubs:", clubsError);
    }

    // Get member counts for user's clubs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userClubIds = userClubMemberships?.map((membership: any) => membership.clubs.id) || [];
    const clubMemberCounts: Record<string, number> = {};

    if (userClubIds.length > 0) {
      const { data: clubMemberCountData } = await supabase
        .from('club_members')
        .select('club_id')
        .in('club_id', userClubIds);

      // Count members per club
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clubMemberCountData?.forEach((member: any) => {
        clubMemberCounts[member.club_id] = (clubMemberCounts[member.club_id] || 0) + 1;
      });
    }

    // Transform clubs data to match expected format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userClubs = userClubMemberships?.map((membership: any) => {
      const club = membership.clubs;
      const leader = Array.isArray(club.leader) ? club.leader[0] : club.leader;
      
      return {
        club: {
          id: club.id,
          name: club.name,
          description: club.description,
          banner_image_url: club.banner_image_url,
          club_type: club.club_type,
          location: club.location,
          total_likes: club.total_likes,
          created_at: club.created_at,
          updated_at: club.updated_at,
          leader_id: club.leader_id,
          leader: leader ? {
            id: leader.id,
            username: leader.username,
            display_name: leader.display_name,
            profile_image_url: leader.profile_image_url
          } : {
            id: '',
            username: '',
            display_name: '',
            profile_image_url: undefined
          }
        },
        role: membership.role,
        joined_at: membership.joined_at,
        memberCount: clubMemberCounts[club.id] || 0
      };
    }) || [];

    // Format final profile data to match ProfileData interface
    const profileData: ProfileData = {
      profileUser: {
        id: userData.id,
        username: userData.username,
        display_name: userData.display_name,
        email: undefined, // Not fetched in this context
        profile_image_url: userData.profile_image_url,
        instagram_url: userData.instagram_url,
        facebook_url: userData.facebook_url,
        tiktok_url: userData.tiktok_url,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        last_seen_inbox: undefined, // Not fetched in this context
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        carsCount: carCount || 0,
        clubsCount: clubsMemberCount || 0,
        eventsCount: eventsAttendedCount || 0
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userCars: userCars?.map((car: any) => ({
        id: car.id,
        user_id: userData.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        image_url: car.images?.[0], // Use first image as primary
        total_likes: car.total_likes,
        created_at: car.created_at,
        updated_at: car.updated_at
      })) || [],
      followers: [], // Not implemented in this simplified version
      following: [], // Not implemented in this simplified version
      userClubs: userClubs,
      isFollowing,
      currentUser: null // Set by the calling page component
    };

    return profileData;
  } catch (error) {
    console.error("❌ Error fetching profile data:", error);
    throw error;
  }
}

/**
 * Get clubs where the user is a leader (for invite functionality)
 */
export async function getLeaderClubsData(userId: string): Promise<LeaderClubsData | null> {
  try {
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
      return null; // Don't fail the whole page, just don't show invite buttons
    }

    // Transform the data to include required fields

    // Get member counts for these clubs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clubIds = leaderClubs?.map((club: any) => club.id) || [];
    const memberCounts: Record<string, number> = {};

    if (clubIds.length > 0) {
      const { data: memberCountData } = await supabase
        .from('club_members')
        .select('club_id')
        .in('club_id', clubIds);

      // Count members per club
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      memberCountData?.forEach((member: any) => {
        memberCounts[member.club_id] = (memberCounts[member.club_id] || 0) + 1;
      });
    }

    // Format response to match expected LeaderClubsData interface
    const formattedResponse = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      leaderClubs: leaderClubs?.map((club: any) => ({
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

    return formattedResponse;
  } catch (error) {
    console.error("Error fetching leader clubs data:", error);
    return null; // Don't fail the whole page, just don't show invite buttons
  }
}

/**
 * Lazy load followers data when dialog is opened
 */
export async function getFollowersData(userId: string) {
  const supabase = await createClient();

  const { data: followers, error } = await supabase
    .from('user_follows')
    .select(`
      follower:users!user_follows_follower_id_fkey(
        id,
        username,
        display_name,
        profile_image_url
      )
    `)
    .eq('following_id', userId);

  if (error) {
    console.error('Error fetching followers:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = followers?.map((f: any) => f.follower).filter(Boolean) || [];
  return result;
}

/**
 * Lazy load following data when dialog is opened
 */
export async function getFollowingData(userId: string) {
  const supabase = await createClient();

  const { data: following, error } = await supabase
    .from('user_follows')
    .select(`
      following:users!user_follows_following_id_fkey(
        id,
        username,
        display_name,
        profile_image_url
      )
    `)
    .eq('follower_id', userId);

  if (error) {
    console.error('Error fetching following:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = following?.map((f: any) => f.following).filter(Boolean) || [];
  return result;
}