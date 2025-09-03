// 'use server'

import { cache } from 'react'
import { createClient } from '@/lib/utils/supabase/server'
import type { Club, ClubMember } from '@/types/club'

export const getAllClubs = cache(async (): Promise<Club[]> => {
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
        display_name: club.users.display_name || club.users.username,
        profile_image_url: club.users.profile_image_url,
      }
    })) || []
  } catch (error) {
    console.error('Error getting all clubs:', error)
    return []
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

    const membershipsWithCounts = await Promise.all(
      data?.map(async (membership) => {
        // Get club details
        const club = await getClubById(membership.club_id)
        if (!club) return null

        // Get member count for each club
        const { count } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', membership.club_id)

        return {
          club,
          role: membership.role || 'member',
          joined_at: membership.joined_at,
          memberCount: count || 0,
        }
      }) || []
    )

    return membershipsWithCounts.filter((m): m is { club: Club; role: string; joined_at: string; memberCount: number } => m !== null)
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
