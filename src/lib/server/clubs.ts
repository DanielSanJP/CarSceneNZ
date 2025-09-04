'use server'

import { cache } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import type { Club, ClubMember } from '@/types/club'
import type { User } from '@/types/user'

export const getUserById = cache(async (userId: string): Promise<User | null> => {
  try {
    const supabase = await createClient()

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Error getting user by ID:', error)
      return null
    }

    return {
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name || profile.username,
      email: profile.email || '',
      profile_image_url: profile.profile_image_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
})

export const getClubById = cache(async (clubId: string): Promise<Club | null> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('id', clubId)
      .single()

    if (error || !data) {
      console.error('Error getting club by ID:', error)
      return null
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      banner_image_url: data.banner_image_url,
      club_type: data.club_type,
      location: data.location,
      leader_id: data.leader_id,
      total_likes: data.total_likes || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      leader: {
        id: data.users.id,
        username: data.users.username,
        display_name: data.users.display_name || data.users.username,
        profile_image_url: data.users.profile_image_url,
      }
    }
  } catch (error) {
    console.error('Error getting club by ID:', error)
    return null
  }
})

export const getClubMembers = cache(async (clubId: string): Promise<ClubMember[]> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('club_members')
      .select(`
        *,
        users!club_members_user_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .eq('club_id', clubId)

    if (error) {
      console.error('Error getting club members:', error)
      return []
    }

    return data?.map(member => ({
      id: member.id,
      club_id: member.club_id,
      user_id: member.user_id,
      role: member.role,
      joined_at: member.joined_at,
      user: {
        id: member.users.id,
        username: member.users.username,
        display_name: member.users.display_name || member.users.username,
        profile_image_url: member.users.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting club members:', error)
    return []
  }
})

export const getUserClubMemberships = cache(async (userId: string): Promise<{ club: Club; role: string; joined_at: string; memberCount: number }[]> => {
  try {
    const supabase = await createClient()

    // Get basic membership data first
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        role,
        joined_at,
        club_id
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error getting user club memberships:', error)
      return []
    }

    if (!data || data.length === 0) return []

    // Get all club details in a single query
    const clubIds = data.map(m => m.club_id)
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select(`
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .in('id', clubIds)

    if (clubsError || !clubs) {
      console.error('Error getting clubs:', clubsError)
      return []
    }

    // Get member counts for all clubs in one batch query
    const memberCounts = await getMemberCountsForClubs(clubIds)

    // Combine the data
    return data.map(membership => {
      const clubData = clubs.find(c => c.id === membership.club_id)
      if (!clubData) return null

      return {
        club: {
          id: clubData.id,
          name: clubData.name,
          description: clubData.description,
          banner_image_url: clubData.banner_image_url,
          club_type: clubData.club_type,
          location: clubData.location,
          leader_id: clubData.leader_id,
          total_likes: clubData.total_likes || 0,
          created_at: clubData.created_at,
          updated_at: clubData.updated_at,
          leader: {
            id: clubData.users.id,
            username: clubData.users.username,
            display_name: clubData.users.display_name || clubData.users.username,
            profile_image_url: clubData.users.profile_image_url,
          }
        },
        role: membership.role || 'member',
        joined_at: membership.joined_at,
        memberCount: memberCounts[membership.club_id] || 0,
      }
    }).filter(Boolean) as { club: Club; role: string; joined_at: string; memberCount: number }[]
  } catch (error) {
    console.error('Error getting user club memberships:', error)
    return []
  }
})

export const isClubMember = cache(async (clubId: string, userId: string): Promise<boolean> => {
  try {
    const supabase = await createClient()

    const { count } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)
      .eq('user_id', userId)

    return (count || 0) > 0
  } catch (error) {
    console.error('Error checking club membership:', error)
    return false
  }
})

export async function createClub(clubData: {
  name: string;
  description: string;
  location: string;
  club_type: string;
  banner_image: string;
  leader_id: string;
}): Promise<Club | null> {
  try {
    console.log('=== createClub function called ===');
    console.log('Club data:', clubData);
    
    const supabase = await createClient()
    console.log('Supabase client created');

    // Insert the club (database will auto-generate UUID)
    const { data: clubInsertData, error: clubError } = await supabase
      .from('clubs')
      .insert({
        name: clubData.name.trim(),
        description: clubData.description.trim(),
        location: clubData.location,
        club_type: clubData.club_type,
        banner_image_url: clubData.banner_image || null,
        leader_id: clubData.leader_id,
      })
      .select()
      .single()

    console.log('Club insert result:', { data: clubInsertData, error: clubError });

    if (clubError || !clubInsertData) {
      console.error('Error creating club:', clubError)
      return null
    }

    console.log('Club created successfully, ID:', clubInsertData.id);

    // Add the leader as a member with 'leader' role
    const { error: memberError } = await supabase
      .from('club_members')
      .insert({
        club_id: clubInsertData.id,
        user_id: clubData.leader_id,
        role: 'leader',
      })

    console.log('Club member insert result:', { error: memberError });

    if (memberError) {
      console.error('Error adding leader as member:', memberError)
      // Don't fail the whole operation, but log the error
    }

    // Return the created club with leader info
    console.log('Fetching complete club data...');
    const result = await getClubById(clubInsertData.id);
    console.log('Final club result:', result ? 'Success' : 'Failed to fetch');
    return result;
  } catch (error) {
    console.error('=== createClub function error ===', error)
    return null
  }
}

export const getClubMemberCount = cache(async (clubId: string): Promise<number> => {
  try {
    const supabase = await createClient()

    const { count } = await supabase
      .from('club_members')
      .select('*', { count: 'exact', head: true })
      .eq('club_id', clubId)

    return count || 0
  } catch (error) {
    console.error('Error getting club member count:', error)
    return 0
  }
})

// Optimized batch function to get member counts for multiple clubs
export const getMemberCountsForClubs = cache(async (clubIds: string[]): Promise<Record<string, number>> => {
  try {
    if (clubIds.length === 0) return {}
    
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('club_members')
      .select('club_id')
      .in('club_id', clubIds)

    if (error) {
      console.error('Error getting member counts for clubs:', error)
      return {}
    }

    // Count members per club
    const counts: Record<string, number> = {}
    clubIds.forEach(id => counts[id] = 0) // Initialize all to 0
    
    data?.forEach(member => {
      counts[member.club_id] = (counts[member.club_id] || 0) + 1
    })

    return counts
  } catch (error) {
    console.error('Error getting member counts for clubs:', error)
    return {}
  }
})

// Get total count of clubs (for pagination)
export const getClubsCount = cache(async (filters?: {
  search?: string;
  location?: string;
  club_type?: string;
}): Promise<number> => {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('clubs')
      .select('*', { count: 'exact', head: true })

    // Apply same filters as main query
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.location && filters.location !== 'all') {
      query = query.eq('location', filters.location)
    }

    if (filters?.club_type && filters.club_type !== 'all') {
      query = query.eq('club_type', filters.club_type)
    }

    const { count, error } = await query

    if (error) {
      console.error('Error getting clubs count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('Error getting clubs count:', error)
    return 0
  }
})

export const getAllClubsWithStats = cache(async (filters?: {
  search?: string;
  location?: string;
  club_type?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}): Promise<(Club & { memberCount: number })[]> => {
  try {
    const supabase = await createClient()

    // Build the query with filters
    let query = supabase
      .from('clubs')
      .select(`
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)

    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.location && filters.location !== 'all') {
      query = query.eq('location', filters.location)
    }

    if (filters?.club_type && filters.club_type !== 'all') {
      query = query.eq('club_type', filters.club_type)
    }

    // Apply sorting
    switch (filters?.sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'likes':
      default:
        query = query.order('total_likes', { ascending: false })
        break
    }

    // Apply pagination
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data: clubs, error } = await query

    if (error || !clubs) {
      console.error('Error getting clubs:', error)
      return []
    }

    // Get member counts for all clubs in a single optimized query
    const clubIds = clubs.map(club => club.id)
    const memberCounts = await getMemberCountsForClubs(clubIds)

    return clubs.map((club) => ({
      id: club.id,
      name: club.name,
      description: club.description,
      banner_image_url: club.banner_image_url,
      club_type: club.club_type,
      location: club.location,
      leader_id: club.leader_id,
      total_likes: club.total_likes || 0,
      created_at: club.created_at,
      updated_at: club.updated_at,
      leader: {
        id: club.users.id,
        username: club.users.username,
        display_name: club.users.display_name || club.users.username,
        profile_image_url: club.users.profile_image_url,
      },
      memberCount: memberCounts[club.id] || 0,
    }))
  } catch (error) {
    console.error('Error getting clubs with stats:', error)
    return []
  }
})

export const getClubTotalLikes = cache(async (clubId: string): Promise<number> => {
  try {
    const supabase = await createClient()

    // Calculate total likes from all cars owned by club members
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        user_id,
        cars!cars_owner_id_fkey (
          total_likes
        )
      `)
      .eq('club_id', clubId)

    if (error) {
      console.error('Error calculating club total likes:', error)
      return 0
    }

    // Sum up all likes from member cars
    const totalLikes = data?.reduce((total, member) => {
      const memberCarLikes = member.cars?.reduce((carTotal, car) => {
        return carTotal + (car.total_likes || 0)
      }, 0) || 0
      return total + memberCarLikes
    }, 0) || 0

    return totalLikes
  } catch (error) {
    console.error('Error calculating club total likes:', error)
    return 0
  }
})
