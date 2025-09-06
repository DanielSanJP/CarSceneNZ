import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/utils/supabase/server';
import type { CarRanking, OwnerRanking, ClubRanking } from '@/types/leaderboard';

// Re-export types for convenience
export type { CarRanking, OwnerRanking, ClubRanking };

/**
 * Get top cars by likes with caching - server-only version
 */
export const getTopCars = cache(async (limit: number = 10): Promise<CarRanking[]> => {
  try {
    const supabase = await createClient();

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
      .limit(limit);

    if (error) {
      console.error('Error getting top cars:', error);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[])?.map((car, index) => ({
      car: {
        id: car.id,
        owner_id: car.owner_id,
        brand: car.brand,
        model: car.model,
        year: car.year,
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
    })) || [];
  } catch (error) {
    console.error('Error getting top cars:', error);
    return [];
  }
});

/**
 * Get top car owners by total likes with caching - server-only version
 */
export const getTopOwners = cache(async (limit: number = 10): Promise<OwnerRanking[]> => {
  try {
    const supabase = await createClient();

    // Try RPC function first
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_top_owners', { result_limit: limit });
      
      if (!rpcError && rpcData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (rpcData as any[]).map((owner, index) => ({
          owner: {
            id: owner.owner_id,
            username: owner.username,
            display_name: owner.display_name || owner.username,
            email: '',
            profile_image_url: owner.profile_image_url,
            created_at: '',
            updated_at: '',
          },
          rank: index + 1,
          totalLikes: owner.total_likes,
          carCount: owner.car_count,
        }));
      }
    } catch {
      // Fall through to manual calculation
    }

    // Fallback: calculate manually
    return await getTopOwnersManual(limit);
  } catch (error) {
    console.error('Error getting top owners:', error);
    return [];
  }
});

/**
 * Manual calculation of top owners when RPC is not available
 */
async function getTopOwnersManual(limit: number): Promise<OwnerRanking[]> {
  try {
    const supabase = await createClient();

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
          profile_image_url
        )
      `);

    if (error || !cars) {
      console.error('Error getting cars for owner ranking:', error);
      return [];
    }

    // Group by owner and calculate totals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerStats = new Map<string, { owner: any; totalLikes: number; carCount: number }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cars as any[]).forEach((car) => {
      const ownerId = car.owner_id;
      const likes = car.total_likes || 0;
      
      if (ownerStats.has(ownerId)) {
        const stats = ownerStats.get(ownerId)!;
        stats.totalLikes += likes;
        stats.carCount += 1;
      } else {
        ownerStats.set(ownerId, {
          owner: car.users,
          totalLikes: likes,
          carCount: 1,
        });
      }
    });

    // Convert to array and sort
    const sortedOwners = Array.from(ownerStats.values())
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, limit);

    return sortedOwners.map((stats, index) => ({
      owner: {
        id: stats.owner.id,
        username: stats.owner.username,
        display_name: stats.owner.display_name || stats.owner.username,
        email: '',
        profile_image_url: stats.owner.profile_image_url,
        created_at: '',
        updated_at: '',
      },
      rank: index + 1,
      totalLikes: stats.totalLikes,
      carCount: stats.carCount,
    }));
  } catch (error) {
    console.error('Error in manual top owners calculation:', error);
    return [];
  }
}

/**
 * Get top clubs by member count with caching - server-only version
 */
export const getTopClubs = cache(async (limit: number = 10): Promise<ClubRanking[]> => {
  try {
    const supabase = await createClient();

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
      .limit(limit);

    if (error) {
      console.error('Error getting top clubs:', error);
      return [];
    }

    // Get member counts for each club
    const clubsWithCounts = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data as any[]).map(async (club, index) => {
        const { count } = await supabase
          .from('club_members')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id);

        return {
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
          rank: index + 1,
          likes: club.total_likes || 0,
          memberCount: count || 0,
        };
      })
    );

    return clubsWithCounts;
  } catch (error) {
    console.error('Error getting top clubs:', error);
    return [];
  }
});

/**
 * Get leaderboard statistics with caching - server-only version
 */
export const getLeaderboardStats = cache(async (): Promise<{
  totalCars: number;
  totalUsers: number;
  totalClubs: number;
  totalEvents: number;
  totalLikes: number;
}> => {
  try {
    const supabase = await createClient();

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
      supabase.from('cars').select('total_likes')
    ]);

    // Calculate total likes across all cars
    const totalLikes = (likesData || []).reduce((sum, car) => sum + (car.total_likes || 0), 0);

    return {
      totalCars: totalCars || 0,
      totalUsers: totalUsers || 0,
      totalClubs: totalClubs || 0,
      totalEvents: totalEvents || 0,
      totalLikes,
    };
  } catch (error) {
    console.error('Error getting leaderboard stats:', error);
    return {
      totalCars: 0,
      totalUsers: 0,
      totalClubs: 0,
      totalEvents: 0,
      totalLikes: 0,
    };
  }
});
