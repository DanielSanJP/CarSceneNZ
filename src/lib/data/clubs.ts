import { createClient } from '@/lib/utils/supabase/client'
import type { Club, ClubMember } from '@/types/club'

export async function getAllClubs(): Promise<Club[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
          profile_image_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all clubs:', error)
      return []
    }

    return data?.map(club => ({
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
        display_name: club.users.username, // display_name not stored in users table
        profile_image_url: club.users.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting all clubs:', error)
    return []
  }
}

export async function getClubById(clubId: string): Promise<Club | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
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
        display_name: data.users.username, // display_name not stored in users table
        profile_image_url: data.users.profile_image_url,
      }
    }
  } catch (error) {
    console.error('Error getting club by ID:', error)
    return null
  }
}

export async function getClubsByLeader(leaderId: string): Promise<Club[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
          profile_image_url
        )
      `)
      .eq('leader_id', leaderId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting clubs by leader:', error)
      return []
    }

    return data?.map(club => ({
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
        display_name: club.users.username, // display_name not stored in users table
        profile_image_url: club.users.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting clubs by leader:', error)
    return []
  }
}

export async function createClub(clubData: Omit<Club, 'id' | 'created_at' | 'updated_at' | 'total_likes' | 'leader'>): Promise<Club | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name: clubData.name,
        description: clubData.description,
        banner_image_url: clubData.banner_image_url,
        club_type: clubData.club_type,
        location: clubData.location,
        leader_id: clubData.leader_id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating club:', error)
      return null
    }

    return await getClubById(data.id)
  } catch (error) {
    console.error('Error creating club:', error)
    return null
  }
}

export async function updateClub(clubId: string, updates: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at' | 'total_likes' | 'leader'>>): Promise<Club | null> {
  try {
    const supabase = createClient()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await supabase
      .from('clubs')
      .update({
        name: updates.name,
        description: updates.description,
        banner_image_url: updates.banner_image_url,
        club_type: updates.club_type,
        location: updates.location,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clubId)
      .select()
      .single()

    if (error) {
      console.error('Error updating club:', error)
      return null
    }

    return await getClubById(clubId)
  } catch (error) {
    console.error('Error updating club:', error)
    return null
  }
}

export async function deleteClub(clubId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId)

    if (error) {
      console.error('Error deleting club:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting club:', error)
    return false
  }
}

export async function getClubMembers(clubId: string): Promise<ClubMember[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('club_members')
      .select(`
        *,
        users!club_members_user_id_fkey (
          id,
          username,
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
        display_name: member.users.username, // display_name not stored in users table
        profile_image_url: member.users.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting club members:', error)
    return []
  }
}

export async function joinClub(clubId: string, userId: string, role: string = 'member'): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
        role: role,
      })

    if (error) {
      console.error('Error joining club:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error joining club:', error)
    return false
  }
}

export async function leaveClub(clubId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error leaving club:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error leaving club:', error)
    return false
  }
}

export async function isClubMember(clubId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

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
}
