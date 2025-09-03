'use server';
import { cache } from 'react';
import { createClient } from '@/lib/utils/supabase/server';
import type { Car } from '@/types/car';
import { getAllCarComponents } from './car-components';

/**
 * Get all cars with caching - server-only version
 */
export const getAllCars = cache(async (): Promise<Car[]> => {
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all cars:', error);
      return [];
    }

    return (data || []).map((car) => ({
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
    } as Car));
  } catch (error) {
    console.error('Error getting all cars:', error);
    return [];
  }
});

/**
 * Get basic car information by ID with caching - server-only version
 */
export const getBasicCar = cache(async (carId: string): Promise<Omit<Car, 'engine' | 'wheels' | 'suspension' | 'brakes' | 'paint_finish' | 'lighting_modifications' | 'bodykit_modifications' | 'seats' | 'steering_wheel' | 'audio_system' | 'gauges' | 'turbo_system' | 'exhaust_system' | 'engine_management' | 'internal_components' | 'fuel_system'> | null> => {
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
});

/**
 * Get cars by owner ID with caching - server-only version
 */
export const getCarsByOwner = cache(async (ownerId: string): Promise<Car[]> => {
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
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting cars by owner:', error);
      return [];
    }

    return (data || []).map((car) => ({
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
    } as Car));
  } catch (error) {
    console.error('Error getting cars by owner:', error);
    return [];
  }
});

/**
 * Get complete car by ID with all components - server-only version
 */
export const getCarById = cache(async (carId: string): Promise<Car | null> => {
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
      .eq('id', carId)
      .single();

    if (error || !data) {
      console.error('Error getting car by id:', error);
      return null;
    }

    // Get all car components using the new consolidated function
    const components = await getAllCarComponents(carId);

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
      // Include all component data from the consolidated car-components module
      engine: components.engine.engine,
      wheels: components.chassis.wheels,
      suspension: components.chassis.suspension,
      brakes: components.chassis.brakes,
      paint_finish: components.exterior.paint_finish,
      lighting_modifications: components.exterior.lighting_modifications,
      bodykit_modifications: components.exterior.bodykit_modifications,
      seats: components.interior.seats,
      steering_wheel: components.interior.steering_wheel,
      audio_system: components.interior.audio_system,
      gauges: components.interior.gauges,
      turbo_system: components.engine.turbo_system,
      exhaust_system: components.engine.exhaust_system,
      engine_management: components.engine.engine_management,
      internal_components: components.engine.internal_components,
      fuel_system: components.engine.fuel_system,
    } as Car;
  } catch (error) {
    console.error('Error getting car by id:', error);
    return null;
  }
});
