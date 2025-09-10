import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Car, CarDetailData } from '@/types/car';
import type { User } from '@/types/user';

export interface GarageData {
  cars: Car[];
  carLikes: Record<string, boolean>;
  userLikeCounts: Record<string, number>;
  currentUser: User | null;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface UserGarageData {
  cars: Car[];
  currentUser: User | null;
}

// Query keys for better cache management
export const garageKeys = {
  all: ['garage'] as const,
  lists: () => [...garageKeys.all, 'list'] as const,
  list: (page: number, limit: number) => [...garageKeys.lists(), page, limit] as const,
  details: () => [...garageKeys.all, 'detail'] as const,
  detail: (carId: string) => [...garageKeys.details(), carId] as const,
  myGarage: (userId?: string) => [...garageKeys.all, 'myGarage', userId] as const,
};

// Get garage data
async function getGarageData(page: number = 1, limit: number = 12): Promise<GarageData> {
  const response = await fetch(`/api/garage?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch garage data');
  }

  return response.json();
}

// Get car detail data
async function getCarDetailData(carId: string): Promise<CarDetailData> {
  const { createClient } = await import('@/lib/utils/supabase/client');
  const supabase = createClient();
  
  const { data, error } = await supabase.rpc('get_car_detail_optimized', {
    car_id_param: carId,
    user_id_param: null, // Will be handled by RLS in client-side context
  });

  if (error) {
    console.error('Error fetching car detail data:', error);
    throw new Error(error.message || 'Failed to fetch car details');
  }

  if (!data) {
    throw new Error('Car not found');
  }

  return data;
}

// Get user's garage data
async function getUserGarageData(): Promise<UserGarageData> {
  const response = await fetch('/api/garage/my-garage', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user garage');
  }

  return response.json();
}

// Toggle car like
async function toggleCarLike(carId: string) {
  const response = await fetch('/api/garage/like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ carId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to toggle car like');
  }

  const result = await response.json();
  return {
    success: result.success,
    newLikeCount: result.new_like_count,
    action: result.action,
    isLiked: result.is_liked,
    error: result.error,
  };
}

// Hook to fetch garage with optimized settings
export function useGarage(page: number = 1, limit: number = 12) {
  return useQuery({
    queryKey: garageKeys.list(page, limit),
    queryFn: () => getGarageData(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes - car data is relatively static
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch if we have cached data
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
  });
}

// Hook to fetch car details with optimized settings
export function useCarDetail(carId: string, initialData?: CarDetailData | null) {
  return useQuery({
    queryKey: garageKeys.detail(carId),
    queryFn: () => getCarDetailData(carId),
    staleTime: 10 * 60 * 1000, // 10 minutes - car details are very static
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
    enabled: !!carId, // Only run query if carId exists
    initialData: initialData || undefined, // Use server-provided data as initial data
  });
}

// Hook to fetch user's garage with optimized settings
export function useUserGarage() {
  return useQuery({
    queryKey: garageKeys.myGarage(),
    queryFn: getUserGarageData,
    staleTime: 2 * 60 * 1000, // 2 minutes - user's own garage might change more frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',
  });
}

// Hook for car like mutations
export function useCarLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (carId: string) => toggleCarLike(carId),
    onMutate: async (carId: string) => {
      // Cancel any outgoing refetches for garage data
      await queryClient.cancelQueries({ queryKey: garageKeys.lists() });
      await queryClient.cancelQueries({ queryKey: garageKeys.detail(carId) });

      // Snapshot the previous values
      const previousGarageData = queryClient.getQueriesData({
        queryKey: garageKeys.lists(),
      });
      const previousCarDetailData = queryClient.getQueryData(garageKeys.detail(carId));

      // Optimistically update garage query caches
      queryClient.setQueriesData<GarageData>(
        { queryKey: garageKeys.lists() },
        (oldData) => {
          if (!oldData) return oldData;

          const updatedCars = oldData.cars.map(car => {
            if (car.id === carId) {
              const wasLiked = oldData.carLikes[carId] || false;
              const currentLikeCount = oldData.userLikeCounts[carId] || 0;
              
              return {
                ...car,
                like_count: wasLiked ? currentLikeCount - 1 : currentLikeCount + 1,
              };
            }
            return car;
          });

          return {
            ...oldData,
            cars: updatedCars,
            carLikes: {
              ...oldData.carLikes,
              [carId]: !oldData.carLikes[carId],
            },
            userLikeCounts: {
              ...oldData.userLikeCounts,
              [carId]: oldData.carLikes[carId] 
                ? (oldData.userLikeCounts[carId] || 0) - 1
                : (oldData.userLikeCounts[carId] || 0) + 1,
            },
          };
        }
      );

      // Optimistically update car detail cache
      queryClient.setQueryData<CarDetailData>(
        garageKeys.detail(carId),
        (oldData) => {
          if (!oldData) return oldData;

          const wasLiked = oldData.car.is_liked;
          const currentLikeCount = oldData.car.total_likes;

          return {
            ...oldData,
            car: {
              ...oldData.car,
              is_liked: !wasLiked,
              total_likes: wasLiked ? currentLikeCount - 1 : currentLikeCount + 1,
            },
          };
        }
      );

      // Return a context object with the snapshotted values
      return { previousGarageData, previousCarDetailData };
    },
    onError: (err, carId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousGarageData) {
        context.previousGarageData.forEach(([queryKey, queryData]) => {
          queryClient.setQueryData(queryKey, queryData);
        });
      }
      if (context?.previousCarDetailData) {
        queryClient.setQueryData(garageKeys.detail(carId), context.previousCarDetailData);
      }
    },
    onSettled: (data, error, carId) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: garageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: garageKeys.detail(carId) });
    },
  });
}

// Prefetch helpers for better UX
export function usePrefetchCarDetail() {
  const queryClient = useQueryClient();

  return (carId: string) => {
    queryClient.prefetchQuery({
      queryKey: garageKeys.detail(carId),
      queryFn: () => getCarDetailData(carId),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
}

export function usePrefetchGaragePage() {
  const queryClient = useQueryClient();

  return (page: number, limit: number = 12) => {
    queryClient.prefetchQuery({
      queryKey: garageKeys.list(page, limit),
      queryFn: () => getGarageData(page, limit),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };
}
