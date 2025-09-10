import { NextRequest, NextResponse } from 'next/server';
import { getUserOptional } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';

interface ClubMembershipData {
  club_id: string;
  role: string;
  joined_at: string;
  club_name: string;
  club_description: string;
  club_banner_image_url: string;
  club_type: string;
  club_location: string;
  club_leader_id: string;
  club_total_likes: number;
  club_created_at: string;
  club_updated_at: string;
  leader_id: string;
  leader_username: string;
  leader_display_name: string;
  leader_profile_image_url: string;
  member_count: number;
}

// Optimized function using RPC
const getProfileDataOptimized = async (userId: string, currentUserId?: string) => {
  const supabase = await createClient();

  try {
    // Use the optimized RPC function for main profile data
    const { data: profileData, error: profileError } = await supabase.rpc(
      'get_user_profile_optimized',
      {
        target_user_id: userId,
        current_user_id: currentUserId || null
      }
    );

    if (profileError || !profileData?.[0]) {
      return { profile: null, cars: [], followers: [], following: [], clubs: [], isFollowing: false, error: profileError };
    }

    const profile = profileData[0];

    // Get additional data in parallel using optimized RPC functions
    const [
      { data: cars },
      { data: followers },
      { data: following },
      { data: clubs }
    ] = await Promise.all([
      supabase.rpc('get_user_cars_optimized', {
        target_user_id: userId,
        page_limit: 20,
        page_offset: 0
      }),
      supabase.rpc('get_user_followers_optimized', {
        target_user_id: userId,
        page_limit: 100,
        page_offset: 0
      }),
      supabase.rpc('get_user_following_optimized', {
        target_user_id: userId,
        page_limit: 100,
        page_offset: 0
      }),
      supabase.rpc('get_user_club_memberships_optimized', {
        user_uuid: userId
      })
    ]);

    // Transform the data to match expected format
    const transformedProfile = {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      email: '',
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      followersCount: Number(profile.followers_count),
      followingCount: Number(profile.following_count),
      carsCount: Number(profile.cars_count),
      clubsCount: Number(profile.clubs_count),
      eventsCount: Number(profile.events_count),
    };

    return {
      profile: transformedProfile,
      cars: cars || [],
      followers: followers || [],
      following: following || [],
      clubs: (clubs || []).map((club: ClubMembershipData) => ({
        club: {
          id: club.club_id,
          name: club.club_name,
          description: club.club_description,
          banner_image_url: club.club_banner_image_url,
          club_type: club.club_type,
          location: club.club_location,
          leader_id: club.club_leader_id,
          total_likes: club.club_total_likes,
          created_at: club.club_created_at,
          updated_at: club.club_updated_at,
          leader: {
            id: club.leader_id,
            username: club.leader_username,
            display_name: club.leader_display_name,
            profile_image_url: club.leader_profile_image_url,
          },
        },
        role: club.role,
        joined_at: club.joined_at,
        memberCount: Number(club.member_count)
      })),
      isFollowing: profile.is_following,
      error: null
    };

  } catch (error) {
    console.error('RPC query failed:', error);
    throw error;
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const currentUser = await getUserOptional();

    // Check if it's a username or ID
    const isUUID = userId.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    let targetUserId = userId;

    // If it's a username, get the user ID first using RPC
    if (!isUUID) {
      const supabase = await createClient();
      const { data: userData } = await supabase.rpc('get_user_by_username', {
        search_username: userId
      });
      
      if (!userData?.[0]) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      targetUserId = userData[0].id;
    }

    // Use optimized RPC function
    const result = await getProfileDataOptimized(targetUserId, currentUser?.id);

    if (!result.profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Set aggressive cache headers for better performance
    const response = NextResponse.json({
      profileUser: result.profile,
      userCars: result.cars,
      followers: result.followers || [],
      following: result.following || [],
      userClubs: result.clubs || [],
      isFollowing: result.isFollowing || false,
      currentUser
    });

    // Cache for 2 minutes for public profiles, 30 seconds for own profile
    const cacheTime = currentUser?.id === targetUserId ? 30 : 120;
    response.headers.set('Cache-Control', `public, max-age=${cacheTime}, stale-while-revalidate=600`);
    response.headers.set('CDN-Cache-Control', `public, max-age=${cacheTime * 2}`);

    return response;

  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
