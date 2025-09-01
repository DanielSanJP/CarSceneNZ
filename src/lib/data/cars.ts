import { createClient } from '@/lib/utils/supabase/client';
import type { Car } from '@/types/car';
import * as CarEngine from './car-engine';
import * as CarChassis from './car-chassis';
import * as CarExterior from './car-exterior';
import * as CarInterior from './car-interior';
import * as CarPerformance from './car-performance';

const supabase = createClient();

/**
 * Get basic car information without components
 */
async function getBasicCar(carId: string): Promise<Omit<Car, 'engine' | 'wheels' | 'suspension' | 'brakes' | 'paint_finish' | 'lighting_modifications' | 'bodykit_modifications' | 'seats' | 'steering_wheel' | 'audio_system' | 'rollcage' | 'gauges' | 'performance_mods' | 'turbo_system' | 'exhaust_system' | 'engine_management' | 'internal_components' | 'fuel_system'> | null> {
  try {
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
      .eq('id', carId)
      .single();

    if (error || !data) {
      console.error('Error getting basic car:', error);
      return null;
    }

    return {
      id: data.id,
      owner_id: data.owner_id,
      brand: data.brand,
      model: data.model,
      year: data.year,
      images: data.images || [],
      total_likes: data.total_likes || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      owner: data.users ? {
        id: data.users.id,
        username: data.users.username,
        display_name: data.users.display_name || data.users.username,
        profile_image_url: data.users.profile_image_url,
      } : undefined,
    };
  } catch (error) {
    console.error('Error getting basic car:', error);
    return null;
  }
}

/**
 * Get all cars with basic information (for listing pages)
 */
export async function getAllCars(): Promise<Car[]> {
  try {
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all cars:', error);
      return [];
    }

    return data?.map(car => ({
      id: car.id,
      owner_id: car.owner_id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      images: car.images || [],
      total_likes: car.total_likes || 0,
      created_at: car.created_at,
      updated_at: car.updated_at,
      owner: car.users ? {
        id: car.users.id,
        username: car.users.username,
        display_name: car.users.display_name || car.users.username,
        profile_image_url: car.users.profile_image_url,
      } : undefined,
    })) || [];
  } catch (error) {
    console.error('Error getting all cars:', error);
    return [];
  }
}

/**
 * Get a complete car with all components by ID
 */
export async function getCarById(carId: string): Promise<Car | null> {
  try {
    // Get basic car information
    const basicCar = await getBasicCar(carId);
    if (!basicCar) return null;

    // Get all component data in parallel
    const [engineComponents, chassisComponents, exteriorComponents, interiorComponents, performanceComponents] = await Promise.all([
      CarEngine.getEngineComponents(carId),
      CarChassis.getChassisComponents(carId),
      CarExterior.getExteriorComponents(carId),
      CarInterior.getInteriorComponents(carId),
      CarPerformance.getPerformanceComponents(carId),
    ]);

    // Combine all data
    return {
      ...basicCar,
      ...engineComponents,
      ...chassisComponents,
      ...exteriorComponents,
      ...interiorComponents,
      ...performanceComponents,
    };
  } catch (error) {
    console.error('Error getting car by ID:', error);
    return null;
  }
}

/**
 * Get cars by owner with basic information
 */
export async function getCarsByOwner(ownerId: string): Promise<Car[]> {
  try {
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
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting cars by owner:', error);
      return [];
    }

    return data?.map(car => ({
      id: car.id,
      owner_id: car.owner_id,
      brand: car.brand,
      model: car.model,
      year: car.year,
      images: car.images || [],
      total_likes: car.total_likes || 0,
      created_at: car.created_at,
      updated_at: car.updated_at,
      owner: car.users ? {
        id: car.users.id,
        username: car.users.username,
        display_name: car.users.display_name || car.users.username,
        profile_image_url: car.users.profile_image_url,
      } : undefined,
    })) || [];
  } catch (error) {
    console.error('Error getting cars by owner:', error);
    return [];
  }
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
 * Update basic car info
 */
export async function updateCar(carId: string, updates: {
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
}): Promise<Car | null> {
  try {
    const { error } = await supabase
      .from('cars')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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

// Form data interface for complete car updates
export interface CompleteCarUpdateData {
  // Basic car info
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
  
  // Engine components
  engine?: CarEngine.EngineComponentsData;
  
  // Chassis components
  chassis?: CarChassis.ChassisComponentsData;
  
  // Exterior components
  exterior?: CarExterior.ExteriorComponentsData;
  
  // Interior components  
  interior?: CarInterior.InteriorComponentsData;
  
  // Performance components
  performance?: CarPerformance.PerformanceComponentsData;
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
  engine?: CarEngine.EngineComponentsData;
  chassis?: CarChassis.ChassisComponentsData;
  exterior?: CarExterior.ExteriorComponentsData;
  interior?: CarInterior.InteriorComponentsData;
  performance?: CarPerformance.PerformanceComponentsData;
}): Promise<Car | null> {
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

    // Add components if provided
    const componentData: CompleteCarUpdateData = {
      engine: carData.engine,
      chassis: carData.chassis,
      exterior: carData.exterior,
      interior: carData.interior,
      performance: carData.performance,
    };

    return await updateCarWithComponents(car.id, componentData);
  } catch (error) {
    console.error('Error creating car with components:', error);
    return null;
  }
}

/**
 * Update car with all components
 */
export async function updateCarWithComponents(
  carId: string,
  carData: CompleteCarUpdateData
): Promise<Car | null> {
  try {
    // Update basic car info first
    if (carData.brand || carData.model || carData.year || carData.images) {
      await updateCar(carId, {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        images: carData.images,
      });
    }
    
    // Update all components in parallel
    const updatePromises: Promise<boolean>[] = [];
    
    if (carData.engine) {
      updatePromises.push(CarEngine.updateEngineComponents(carId, carData.engine));
    }
    
    if (carData.chassis) {
      updatePromises.push(CarChassis.updateChassisComponents(carId, carData.chassis));
    }
    
    if (carData.exterior) {
      updatePromises.push(CarExterior.updateExteriorComponents(carId, carData.exterior));
    }
    
    if (carData.interior) {
      updatePromises.push(CarInterior.updateInteriorComponents(carId, carData.interior));
    }
    
    if (carData.performance) {
      updatePromises.push(CarPerformance.updatePerformanceComponents(carId, carData.performance));
    }
    
    await Promise.all(updatePromises);
    
    // Return updated car with all components
    return await getCarById(carId);
  } catch (error) {
    console.error('Error updating car with components:', error);
    return null;
  }
}

/**
 * Delete car and all associated components
 */
export async function deleteCar(carId: string): Promise<boolean> {
  try {
    // Delete all components first (foreign key constraints will handle cascade)
    await Promise.all([
      CarEngine.deleteEngineComponents(carId),
      CarChassis.deleteChassisComponents(carId),
      CarExterior.deleteExteriorComponents(carId),
      CarInterior.deleteInteriorComponents(carId),
      CarPerformance.deletePerformanceComponents(carId),
    ]);

    // Delete main car record
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
 * Like/Unlike functions (unchanged)
 */
export async function likeCar(carId: string, userId: string): Promise<boolean> {
  try {
    const { data: existingLike } = await supabase
      .from('car_likes')
      .select('id')
      .eq('car_id', carId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      return true; // Already liked
    }

    const { error: likeError } = await supabase
      .from('car_likes')
      .insert({
        car_id: carId,
        user_id: userId,
      });

    if (likeError) {
      console.error('Error liking car:', likeError);
      return false;
    }

    // Update car likes count
    const { error: updateError } = await supabase.rpc('increment_car_likes', { car_id: carId });
    if (updateError) {
      console.error('Error updating car likes count:', updateError);
    }

    return true;
  } catch (error) {
    console.error('Error liking car:', error);
    return false;
  }
}

export async function unlikeCar(carId: string, userId: string): Promise<boolean> {
  try {
    const { error: unlikeError } = await supabase
      .from('car_likes')
      .delete()
      .eq('car_id', carId)
      .eq('user_id', userId);

    if (unlikeError) {
      console.error('Error unliking car:', unlikeError);
      return false;
    }

    // Update car likes count
    const { error: updateError } = await supabase.rpc('decrement_car_likes', { car_id: carId });
    if (updateError) {
      console.error('Error updating car likes count:', updateError);
    }

    return true;
  } catch (error) {
    console.error('Error unliking car:', error);
    return false;
  }
}

export async function isCarLiked(carId: string, userId: string): Promise<boolean> {
  try {
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
