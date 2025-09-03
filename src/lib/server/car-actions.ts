// 'use server';

import { createClient } from '@/lib/utils/supabase/server';
import type { Car } from '@/types/car';
import {
  updateEngineComponents,
  deleteEngineComponents,
  updateChassisComponents,
  deleteChassisComponents,
  updateExteriorComponents,
  deleteExteriorComponents,
  updateInteriorComponents,
  deleteInteriorComponents,
  type EngineComponentsData,
  type ChassisComponentsData,
  type ExteriorComponentsData,
  type InteriorComponentsData,
} from './car-components';
import { getCarById } from './cars';

// Form data interface for complete car updates
export interface CompleteCarUpdateData {
  // Basic car info
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
  
  // Engine components
  engine?: EngineComponentsData;
  
  // Chassis components
  chassis?: ChassisComponentsData;
  
  // Exterior components
  exterior?: ExteriorComponentsData;
  
  // Interior components  
  interior?: InteriorComponentsData;
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
 * Update basic car info
 */
export async function updateCar(carId: string, updates: {
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
}): Promise<Car | null> {
  try {
    const supabase = await createClient();
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

/**
 * Create car with all components
 */
export async function createCarWithComponents(carData: {
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
  engine?: EngineComponentsData;
  chassis?: ChassisComponentsData;
  exterior?: ExteriorComponentsData;
  interior?: InteriorComponentsData;
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
      updatePromises.push(updateEngineComponents(carId, carData.engine));
    }
    
    if (carData.chassis) {
      updatePromises.push(updateChassisComponents(carId, carData.chassis));
    }
    
    if (carData.exterior) {
      updatePromises.push(updateExteriorComponents(carId, carData.exterior));
    }
    
    if (carData.interior) {
      updatePromises.push(updateInteriorComponents(carId, carData.interior));
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
      deleteEngineComponents(carId),
      deleteChassisComponents(carId),
      deleteExteriorComponents(carId),
      deleteInteriorComponents(carId),
    ]);

    // Delete main car record
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
 * Like/Unlike functions
 */
export async function likeCar(carId: string, userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
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
    const supabase = await createClient();
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
