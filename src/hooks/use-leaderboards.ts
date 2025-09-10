import { useQuery } from '@tanstack/react-query';
import type { CarRanking, OwnerRanking, ClubRanking } from '@/types/leaderboard';
import { createClient } from '@/lib/utils/supabase/client';

// Leaderboards Data Interface
export interface LeaderboardsData {
  cars: CarRanking[];
  owners: OwnerRanking[];
  clubs: ClubRanking[];
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

// Query keys for better cache management
export const leaderboardsKeys = {
  all: ['leaderboards'] as const,
  data: () => [...leaderboardsKeys.all, 'data'] as const,
} as const;

// Get leaderboards data
export async function getLeaderboardsData(): Promise<LeaderboardsData> {
  const supabase = createClient();

  try {
    // Fetch top cars with owner info
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select(`
        id,
        brand,
        model,
        year,
        images,
        total_likes,
        owner_id,
        created_at,
        updated_at,
        users!cars_owner_id_fkey (
          id,
          username,
          display_name,
          profile_image_url,
          created_at,
          updated_at
        )
      `)
      .order('total_likes', { ascending: false })
      .limit(10);

    if (carsError) {
      console.error('Error fetching cars:', carsError);
      throw new Error('Failed to fetch cars data');
    }

    // Fetch top owners (users with most total likes across all their cars)
    const { data: owners, error: ownersError } = await supabase
      .from('users')
      .select(`
        id,
        username,
        display_name,
        profile_image_url,
        created_at,
        updated_at,
        cars!cars_owner_id_fkey (
          total_likes
        )
      `)
      .limit(50); // Get more users to calculate totals

    if (ownersError) {
      console.error('Error fetching owners:', ownersError);
      throw new Error('Failed to fetch owners data');
    }

    // Fetch top clubs with member counts
    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select(`
        id,
        name,
        description,
        banner_image_url,
        total_likes,
        leader_id,
        club_type,
        location,
        created_at,
        updated_at,
        users!clubs_leader_id_fkey (
          id,
          username,
          display_name,
          profile_image_url,
          created_at,
          updated_at
        ),
        club_members (
          id
        )
      `)
      .order('total_likes', { ascending: false })
      .limit(10);

    if (clubsError) {
      console.error('Error fetching clubs:', clubsError);
      throw new Error('Failed to fetch clubs data');
    }

    // Process cars data
    const carRankings: CarRanking[] = (cars || [])
      .filter(car => car && car.id) // Filter out invalid cars
      .map((car, index) => {
        const ownerData = Array.isArray(car.users) ? car.users[0] : car.users;
        return {
          rank: index + 1,
          likes: car.total_likes || 0,
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
            // Add owner info, ensuring it has required properties
            owner: ownerData ? {
              id: ownerData.id,
              username: ownerData.username || 'unknown',
              display_name: ownerData.display_name || 'Unknown User',
              profile_image_url: ownerData.profile_image_url,
              created_at: ownerData.created_at,
              updated_at: ownerData.updated_at,
            } : {
              id: car.owner_id,
              username: 'unknown',
              display_name: 'Unknown User',
              profile_image_url: null,
              created_at: car.created_at,
              updated_at: car.updated_at,
            },
          },
        };
      });

    // Process owners data - calculate total likes and sort
    const ownersWithTotals = (owners || [])
      .filter(owner => owner && owner.id) // Filter out invalid owners
      .map(owner => {
        const carsData = Array.isArray(owner.cars) ? owner.cars : [];
        const totalLikes = carsData.reduce((sum: number, car: { total_likes?: number }) => sum + (car.total_likes || 0), 0);
        return {
          owner: {
            id: owner.id,
            username: owner.username || 'unknown',
            display_name: owner.display_name || 'Unknown User',
            profile_image_url: owner.profile_image_url,
            created_at: owner.created_at,
            updated_at: owner.updated_at,
          },
          totalLikes,
          carCount: carsData.length,
        };
      })
      .filter(owner => owner.totalLikes > 0)
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 10);

    const ownerRankings: OwnerRanking[] = ownersWithTotals.map((ownerData, index) => ({
      rank: index + 1,
      owner: ownerData.owner,
      totalLikes: ownerData.totalLikes,
      carCount: ownerData.carCount,
    }));

    // Process clubs data
    const clubRankings: ClubRanking[] = (clubs || [])
      .filter(club => club && club.id) // Filter out invalid clubs
      .map((club, index) => {
        const leaderData = Array.isArray(club.users) ? club.users[0] : club.users;
        return {
          rank: index + 1,
          likes: club.total_likes || 0,
          memberCount: Array.isArray(club.club_members) ? club.club_members.length : 0,
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
            // Add leader info, ensuring it has required properties
            leader: leaderData ? {
              id: leaderData.id,
              username: leaderData.username || 'unknown',
              display_name: leaderData.display_name || 'Unknown Leader',
              profile_image_url: leaderData.profile_image_url,
              created_at: leaderData.created_at,
              updated_at: leaderData.updated_at,
            } : {
              id: club.leader_id,
              username: 'unknown',
              display_name: 'Unknown Leader',
              profile_image_url: null,
              created_at: club.created_at,
              updated_at: club.updated_at,
            },
          },
        };
      });

    return {
      cars: carRankings,
      owners: ownerRankings,
      clubs: clubRankings,
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `leaderboards_${Date.now()}`,
      },
    };
  } catch (error) {
    console.error('Error fetching leaderboards data:', error);
    throw new Error('Failed to fetch leaderboards data');
  }
}

// React Query hook for leaderboards data
export function useLeaderboards(initialData?: LeaderboardsData | null) {
  return useQuery({
    queryKey: leaderboardsKeys.data(),
    queryFn: getLeaderboardsData,
    initialData: initialData || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
