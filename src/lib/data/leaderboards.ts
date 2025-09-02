import { createClient } from '@/lib/utils/supabase/client'
import type { Car } from '@/types/car'
import type { User } from '@/types/user'
import type { Club } from '@/types/club'

export interface CarRanking {
  car: Car;
  rank: number;
  likes: number;
}

export interface OwnerRanking {
  owner: User;
  rank: number;
  totalLikes: number;
  carCount: number;
}

export interface ClubRanking {
  club: Club;
  rank: number;
  likes: number;
  memberCount: number;
}

export async function getTopCars(limit: number = 10): Promise<CarRanking[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        users!cars_owner_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .order('total_likes', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error getting top cars:', error)
      return []
    }

    return data?.map((car, index) => ({
      car: {
        id: car.id,
        owner_id: car.owner_id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        suspension_type: car.suspension_type,
        wheel_specs: car.wheel_specs,
        tire_specs: car.tire_specs,
        engine: car.engine,
        suspension: car.suspension,
        brakes: car.brakes,
        exterior: car.exterior,
        interior: car.interior,
        images: car.images || [],
        total_likes: car.total_likes || 0,
        created_at: car.created_at,
        updated_at: car.updated_at,
        owner: {
          id: car.users.id,
          username: car.users.username,
          display_name: car.users.display_name || car.users.username,
          profile_image_url: car.users.profile_image_url,
        }
      },
      rank: index + 1,
      likes: car.total_likes || 0,
    })) || []
  } catch (error) {
    console.error('Error getting top cars:', error)
    return []
  }
}

export async function getTopOwners(limit: number = 10): Promise<OwnerRanking[]> {
  try {
    const supabase = createClient()

    // Try RPC function first
    try {
      const { data, error } = await supabase
        .rpc('get_top_owners', { limit_param: limit })

      if (!error && data && Array.isArray(data)) {
        return data.map((owner: {
          id: string;
          username: string;
          display_name?: string;
          profile_image_url?: string;
          created_at: string;
          updated_at: string;
          total_likes?: number;
          car_count?: number;
        }, index: number) => ({
          owner: {
            id: owner.id,
            username: owner.username,
            display_name: owner.display_name || owner.username,
            email: '',
            profile_image_url: owner.profile_image_url,
            created_at: owner.created_at,
            updated_at: owner.updated_at,
          },
          rank: index + 1,
          totalLikes: owner.total_likes || 0,
          carCount: owner.car_count || 0,
        }))
      }
    } catch {
      console.log('RPC function not available, using manual calculation')
    }

    // Fallback: calculate manually
    return await getTopOwnersManual(limit)
  } catch (error) {
    console.error('Error getting top owners:', error)
    // Return empty array instead of throwing
    return []
  }
}

async function getTopOwnersManual(limit: number): Promise<OwnerRanking[]> {
  try {
    const supabase = createClient()

    // Get all cars grouped by owner
    const { data: cars, error } = await supabase
      .from('cars')
      .select(`
        owner_id,
        total_likes,
        users!cars_owner_id_fkey (
          id,
          username,
          display_name,
          profile_image_url,
          created_at,
          updated_at
        )
      `)

    if (error) {
      console.error('Error getting cars for manual ranking:', error)
      return []
    }

    // Group by owner and calculate totals
    const ownerStats = new Map<string, {
      owner: {
        id: string;
        username: string;
        display_name?: string;
        profile_image_url?: string;
        created_at: string;
        updated_at: string;
      };
      totalLikes: number;
      carCount: number;
    }>()

    cars?.forEach(car => {
      const ownerId = car.owner_id
      const existing = ownerStats.get(ownerId) || {
        owner: car.users && !Array.isArray(car.users) ? car.users : {
          id: ownerId,
          username: 'Unknown',
          display_name: 'Unknown',
          profile_image_url: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        totalLikes: 0,
        carCount: 0,
      }

      existing.totalLikes += car.total_likes || 0
      existing.carCount += 1
      ownerStats.set(ownerId, existing)
    })

    // Sort and limit
    const sorted = Array.from(ownerStats.entries())
      .sort(([, a], [, b]) => b.totalLikes - a.totalLikes)
      .slice(0, limit)

        return sorted.map(([, stats], index) => ({
      owner: {
        id: stats.owner.id,
        username: stats.owner.username,
        display_name: stats.owner.display_name || stats.owner.username,
        email: '',
        profile_image_url: stats.owner.profile_image_url,
        created_at: stats.owner.created_at,
        updated_at: stats.owner.updated_at,
      },
      rank: index + 1,
      totalLikes: stats.totalLikes,
      carCount: stats.carCount,
    }))
  } catch (error) {
    console.error('Error in manual owner ranking:', error)
    return []
  }
}

export async function getTopClubs(limit: number = 10): Promise<ClubRanking[]> {
  try {
    const supabase = createClient()

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
      .order('total_likes', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error getting top clubs:', error)
      return []
    }

    const rankings: ClubRanking[] = []

    for (let i = 0; i < (data?.length || 0); i++) {
      const club = data[i]

      // Get member count
      const { count: memberCount } = await supabase
        .from('club_members')
        .select('*', { count: 'exact', head: true })
        .eq('club_id', club.id)

      rankings.push({
        club: {
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
        },
        rank: i + 1,
        likes: club.total_likes || 0,
        memberCount: memberCount || 0,
      })
    }

    return rankings
  } catch (error) {
    console.error('Error getting top clubs:', error)
    return []
  }
}

export async function getLeaderboardStats(): Promise<{
  totalCars: number;
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalLikes: number;
}> {
  try {
    const supabase = createClient()

    const [
      { count: totalCars },
      { count: totalUsers },
      { count: totalClubs },
      { count: totalEvents },
      { data: likesData }
    ] = await Promise.all([
      supabase.from('cars').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('clubs').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('car_likes').select('id'),
    ])

    const totalLikes = likesData?.length || 0

    return {
      totalCars: totalCars || 0,
      totalUsers: totalUsers || 0,
      totalClubs: totalClubs || 0,
      totalEvents: totalEvents || 0,
      totalLikes,
    }
  } catch (error) {
    console.error('Error getting leaderboard stats:', error)
    return {
      totalCars: 0,
      totalUsers: 0,
      totalClubs: 0,
      totalEvents: 0,
      totalLikes: 0,
    }
  }
}
