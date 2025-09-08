'use server';

import { createClient } from '@/lib/utils/supabase/server';
import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import type { Car } from '@/types/car';

// Helper function to get car by ID for server actions
export const getCarById = cache(async (id: string): Promise<Car | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Car;
});

// Optimized function to get car by ID with user like status for detail pages
export const getCarByIdWithLikeStatus = cache(async (id: string, userId?: string): Promise<(Car & { is_liked: boolean }) | null> => {
  const supabase = await createClient();
  
  // For now, use SELECT * to ensure we get all fields (we can optimize field selection later)
  const { data: car, error } = await supabase
    .from("cars")
    .select(`
      *,
      owner:users!owner_id (
        id,
        username,
        display_name,
        profile_image_url
      )
    `)
    .eq("id", id)
    .single();

  if (error || !car) {
    console.error("Error fetching car:", error);
    return null;
  }

  // Check if user has liked this car (separate query for now to avoid complex typing)
  let isLiked = false;
  if (userId) {
    const { data: likeData } = await supabase
      .from("car_likes")
      .select("id")
      .eq("car_id", id)
      .eq("user_id", userId)
      .single();
    
    isLiked = !!likeData;
  }
  
  return {
    ...(car as unknown as Car),
    is_liked: isLiked
  };
});

// Form data interface for complete car updates
export interface CompleteCarUpdateData {
  // Basic car info
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
  
  // Engine specifications
  engine_code?: string;
  displacement?: string;
  aspiration?: string;
  power_hp?: number;
  torque_nm?: number;

  // Engine management
  ecu?: string;
  tuned_by?: string;

  // Internal engine components
  pistons?: string;
  connecting_rods?: string;
  valves?: string;
  valve_springs?: string;
  camshafts?: string;

  // Exhaust & intake
  header?: string;
  exhaust?: string;
  intake?: string;

  // Turbo system
  turbo?: string;
  intercooler?: string;

  // Fuel system
  fuel_injectors?: string;
  fuel_pump?: string;
  fuel_rail?: string;

  // Audio system
  head_unit?: string;
  speakers?: string;
  subwoofer?: string;
  amplifier?: string;

  // Exterior modifications
  front_bumper?: string;
  front_lip?: string;
  rear_bumper?: string;
  rear_lip?: string;
  side_skirts?: string;
  rear_spoiler?: string;
  diffuser?: string;
  fender_flares?: string;
  hood?: string;

  // Paint & finish
  paint_color?: string;
  paint_finish?: string;
  wrap_brand?: string;
  wrap_color?: string;

  // Interior
  front_seats?: string;
  rear_seats?: string;
  steering_wheel?: string;

  // Lighting
  headlights?: string;
  taillights?: string;
  fog_lights?: string;
  underglow?: string;
  interior_lighting?: string;

  // JSON structured fields
  brakes?: {
    front?: {
      caliper?: string;
      pads?: string;
      disc_size?: string;
      disc_type?: string;
    };
    rear?: {
      caliper?: string;
      pads?: string;
      disc_size?: string;
      disc_type?: string;
    };
  };

  suspension?: {
    front?: {
      suspension?: string;
      spring_rate?: string;
      strut_brace?: string;
      anti_roll_bar?: string;
      camber_degrees?: number;
      caster_degrees?: string;
      toe_degrees?: string;
    };
    rear?: {
      suspension?: string;
      spring_rate?: string;
      strut_brace?: string;
      anti_roll_bar?: string;
      camber_degrees?: number;
      caster_degrees?: string;
      toe_degrees?: string;
    };
  };

  wheels?: {
    front?: {
      wheel?: string;
      wheel_size?: string;
      wheel_offset?: string;
      tyre?: string;
      tyre_size?: string;
    };
    rear?: {
      wheel?: string;
      wheel_size?: string;
      wheel_offset?: string;
      tyre?: string;
      tyre_size?: string;
    };
  };

  gauges?: Array<{
    id?: string;
    gauge_type?: string;
    brand?: string;
  }>;
}

/**
 * Create basic car (just core info)
 */
export async function createCar(carData: {
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
}): Promise<Car | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('cars')
      .insert({
        owner_id: carData.owner_id,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        images: carData.images || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating car:', error);
      return null;
    }

    return await getCarById(data.id);
  } catch (error) {
    console.error('Error creating car:', error);
    return null;
  }
}

/**
 * Update car with all data
 */
export async function updateCar(carId: string, updates: CompleteCarUpdateData): Promise<Car | null> {
  try {
    const supabase = await createClient();
    
    // Prepare update data, excluding undefined values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Add all fields that are defined in updates
    Object.keys(updates).forEach(key => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = (updates as Record<string, any>)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    const { error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', carId);

    if (error) {
      console.error('Error updating car:', error);
      return null;
    }

    return await getCarById(carId);
  } catch (error) {
    console.error('Error updating car:', error);
    return null;
  }
}

/**
 * Create car with all components
 */
export async function createCarWithComponents(carData: {
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
} & CompleteCarUpdateData): Promise<Car | null> {
  try {
    // Create basic car first
    const car = await createCar({
      owner_id: carData.owner_id,
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      images: carData.images,
    });

    if (!car) {
      throw new Error('Failed to create basic car');
    }

    // Update with all component data
    const componentData: CompleteCarUpdateData = { ...carData };
    // Remove the basic car fields that were already used in creation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { owner_id, brand, model, year, images, ...restData } = componentData as any;

    return await updateCar(car.id, restData);
  } catch (error) {
    console.error('Error creating car with components:', error);
    return null;
  }
}

/**
 * Update car with all components (alias for updateCar)
 */
export async function updateCarWithComponents(
  carId: string,
  carData: CompleteCarUpdateData
): Promise<Car | null> {
  return await updateCar(carId, carData);
}

/**
 * Delete car and all associated components
 */
export async function deleteCar(carId: string): Promise<boolean> {
  try {
    // With the flattened structure, we just need to delete the main car record
    const supabase = await createClient();
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId);

    if (error) {
      console.error('Error deleting car:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting car:', error);
    return false;
  }
}

/**
 * Like/Unlike functions - Using car_likes table as single source of truth
 */
export async function likeCar(carId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Use upsert to prevent duplicate likes (safer than checking then inserting)
    const { error: likeError } = await supabase
      .from('car_likes')
      .upsert(
        {
          car_id: carId,
          user_id: userId,
        },
        {
          onConflict: 'car_id,user_id',
          ignoreDuplicates: true
        }
      );

    if (likeError) {
      console.error('Error liking car:', likeError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error liking car:', error);
    return false;
  }
}

export async function unlikeCar(carId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Delete the like - trigger will automatically update car.total_likes
    const { error: unlikeError } = await supabase
      .from('car_likes')
      .delete()
      .eq('car_id', carId)
      .eq('user_id', userId);

    if (unlikeError) {
      console.error('Error unliking car:', unlikeError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error unliking car:', error);
    return false;
  }
}

export async function isCarLiked(carId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId)
      .eq('user_id', userId);

    return (count || 0) > 0;
  } catch (error) {
    console.error('Error checking car like status:', error);
    return false;
  }
}

export async function getCarLikeCount(carId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId);

    return count || 0;
  } catch (error) {
    console.error('Error getting car like count:', error);
    return 0;
  }
}

/**
 * Server action to like a car
 */
export async function likeCarAction(carId: string, userId: string): Promise<{ success: boolean; newLikeCount?: number; error?: string }> {
  try {
    const success = await likeCar(carId, userId);
    if (success) {
      // Get the count directly from car_likes table (more reliable than waiting for trigger)
      const newLikeCount = await getCarLikeCount(carId);
      
      // Revalidate pages that show car data to sync like state
      revalidatePath('/garage');
      revalidatePath(`/garage/${carId}`);
      
      return { success: true, newLikeCount };
    }
    return { success: false, error: 'Failed to like car' };
  } catch (error) {
    console.error('Error in likeCarAction:', error);
    return { success: false, error: 'Failed to like car' };
  }
}

/**
 * Server action to unlike a car
 */
export async function unlikeCarAction(carId: string, userId: string): Promise<{ success: boolean; newLikeCount?: number; error?: string }> {
  try {
    const success = await unlikeCar(carId, userId);
    if (success) {
      // Get the count directly from car_likes table (more reliable than waiting for trigger)
      const newLikeCount = await getCarLikeCount(carId);
      
      // Revalidate pages that show car data to sync like state
      revalidatePath('/garage');
      revalidatePath(`/garage/${carId}`);
      
      return { success: true, newLikeCount };
    }
    return { success: false, error: 'Failed to unlike car' };
  } catch (error) {
    console.error('Error in unlikeCarAction:', error);
    return { success: false, error: 'Failed to unlike car' };
  }
}

// Gallery interface for optimized car listing
interface CarGalleryItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  images: string[];
  total_likes: number;
  created_at: string;
  owner_id: string;
  is_liked?: boolean;
  owner: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

/**
 * Get paginated cars for garage gallery with optimized field selection
 */
export const getCarsPaginated = cache(async (
  page: number = 1,
  limit: number = 12,
  userId?: string
): Promise<{ cars: CarGalleryItem[]; total: number }> => {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;

    // Get cars with only the fields needed for gallery display
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select(`
        id,
        brand,
        model,
        year,
        images,
        total_likes,
        created_at,
        owner_id,
        owner:users!owner_id (
          id,
          username,
          display_name,
          profile_image_url
        )
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (carsError) {
      console.error("Error fetching cars:", carsError);
      return { cars: [], total: 0 };
    }

    // Get total count for pagination
    const { count } = await supabase
      .from("cars")
      .select("*", { count: "exact", head: true });

    let carsWithLikeStatus: CarGalleryItem[] = (cars || []).map(car => ({
      ...car,
      owner: Array.isArray(car.owner) ? car.owner[0] : car.owner
    })) as CarGalleryItem[];

    // If user is provided, get their liked cars in a single query
    if (userId && cars && cars.length > 0) {
      const carIds = cars.map(car => car.id);
      const { data: likedCars } = await supabase
        .from("car_likes")
        .select("car_id")
        .eq("user_id", userId)
        .in("car_id", carIds);

      const likedCarIds = new Set(likedCars?.map(like => like.car_id) || []);
      
      carsWithLikeStatus = carsWithLikeStatus.map(car => ({
        ...car,
        is_liked: likedCarIds.has(car.id)
      }));
    }

    return {
      cars: carsWithLikeStatus,
      total: count || 0
    };
  } catch (error) {
    console.error("Error in getCarsPaginated:", error);
    return { cars: [], total: 0 };
  }
});

// Optimized function to get user's cars for my-garage page
export const getUserCars = cache(async (userId: string): Promise<Car[]> => {
  try {
    const supabase = await createClient();
    
    // Select only essential fields for my-garage view performance
    const { data: cars, error } = await supabase
      .from("cars")
      .select(`
        id,
        owner_id,
        brand,
        model,
        year,
        images,
        total_likes,
        created_at,
        updated_at
      `)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user cars:", error);
      return [];
    }

    return cars || [];
  } catch (error) {
    console.error("Error in getUserCars:", error);
    return [];
  }
});

/**
 * Get total count of cars for pagination
 */
export const getCarsCount = cache(async (): Promise<number> => {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("cars")
      .select("*", { count: "exact", head: true });

    return count || 0;
  } catch (error) {
    console.error("Error getting cars count:", error);
    return 0;
  }
});
