import { createClient } from '@/lib/utils/supabase/client'
import type { Car } from '@/types/car'

export async function getAllCars(): Promise<Car[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        users!cars_owner_id_fkey (
          id,
          username,
          profile_image_url
        ),
        car_engines (*),
        car_engine_modifications (*),
        car_wheels (*),
        car_suspension (*),
        car_suspension_accessories (*),
        car_brakes (*),
        car_brake_accessories (*),
        car_exterior (*),
        car_interior (*),
        car_performance_mods (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all cars:', error)
      return []
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
      owner: {
        id: car.users.id,
        username: car.users.username,
        display_name: car.users.username,
        profile_image_url: car.users.profile_image_url,
      },
      engine: car.car_engines?.[0] || undefined,
      engine_modifications: car.car_engine_modifications || [],
      wheels: car.car_wheels || [],
      suspension: car.car_suspension || [],
      suspension_accessories: car.car_suspension_accessories || [],
      brakes: car.car_brakes || [],
      brake_accessories: car.car_brake_accessories || [],
      exterior: car.car_exterior || [],
      interior: car.car_interior || [],
      performance_mods: car.car_performance_mods || [],
    })) || []
  } catch (error) {
    console.error('Error getting all cars:', error)
    return []
  }
}

export async function getCarById(carId: string): Promise<Car | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        users!cars_owner_id_fkey (
          id,
          username,
          profile_image_url
        ),
        car_engines (*),
        car_engine_modifications (*),
        car_wheels (*),
        car_suspension (*),
        car_suspension_accessories (*),
        car_brakes (*),
        car_brake_accessories (*),
        car_exterior (*),
        car_interior (*),
        car_performance_mods (*)
      `)
      .eq('id', carId)
      .single()

    if (error || !data) {
      console.error('Error getting car by ID:', error)
      return null
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
      owner: {
        id: data.users.id,
        username: data.users.username,
        display_name: data.users.username,
        profile_image_url: data.users.profile_image_url,
      },
      engine: data.car_engines?.[0] || undefined,
      engine_modifications: data.car_engine_modifications || [],
      wheels: data.car_wheels || [],
      suspension: data.car_suspension || [],
      suspension_accessories: data.car_suspension_accessories || [],
      brakes: data.car_brakes || [],
      brake_accessories: data.car_brake_accessories || [],
      exterior: data.car_exterior || [],
      interior: data.car_interior || [],
      performance_mods: data.car_performance_mods || [],
    }
  } catch (error) {
    console.error('Error getting car by ID:', error)
    return null
  }
}

export async function getCarsByOwner(ownerId: string): Promise<Car[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('cars')
      .select(`
        *,
        users!cars_owner_id_fkey (
          id,
          username,
          profile_image_url
        ),
        car_engines (*),
        car_engine_modifications (*),
        car_wheels (*),
        car_suspension (*),
        car_suspension_accessories (*),
        car_brakes (*),
        car_brake_accessories (*),
        car_exterior (*),
        car_interior (*),
        car_performance_mods (*)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting cars by owner:', error)
      return []
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
      owner: {
        id: car.users.id,
        username: car.users.username,
        display_name: car.users.username,
        profile_image_url: car.users.profile_image_url,
      },
      engine: car.car_engines?.[0] || undefined,
      engine_modifications: car.car_engine_modifications || [],
      wheels: car.car_wheels || [],
      suspension: car.car_suspension || [],
      suspension_accessories: car.car_suspension_accessories || [],
      brakes: car.car_brakes || [],
      brake_accessories: car.car_brake_accessories || [],
      exterior: car.car_exterior || [],
      interior: car.car_interior || [],
      performance_mods: car.car_performance_mods || [],
    })) || []
  } catch (error) {
    console.error('Error getting cars by owner:', error)
    return []
  }
}

// Create basic car (just core info)
export async function createCar(carData: {
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
}): Promise<Car | null> {
  try {
    const supabase = createClient()

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
      .single()

    if (error) {
      console.error('Error creating car:', error)
      return null
    }

    return await getCarById(data.id)
  } catch (error) {
    console.error('Error creating car:', error)
    return null
  }
}

// Update basic car info
export async function updateCar(carId: string, updates: {
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
}): Promise<Car | null> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('cars')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carId)
      .select()
      .single()

    if (error) {
      console.error('Error updating car:', error)
      return null
    }

    return await getCarById(carId)
  } catch (error) {
    console.error('Error updating car:', error)
    return null
  }
}

// Helper functions for normalized car components

// Engine functions
export async function createCarEngine(carId: string, engineData: {
  engine_code?: string;
  displacement?: string;
  aspiration?: string;
  power_hp?: number;
  torque_nm?: number;
}) {
  const supabase = createClient()
  return await supabase
    .from('car_engines')
    .upsert({ car_id: carId, ...engineData }, { onConflict: 'car_id' })
    .select()
    .single()
}

// Wheel functions
export async function createCarWheels(carId: string, wheelsData: {
  position: 'front' | 'rear';
  wheel_brand?: string;
  wheel_size?: string;
  wheel_offset?: string;
  tire_size?: string;
  camber_degrees?: number;
}[]) {
  const supabase = createClient()
  
  // Delete existing wheels first
  await supabase.from('car_wheels').delete().eq('car_id', carId)
  
  // Insert new wheels
  return await supabase
    .from('car_wheels')
    .insert(wheelsData.map(wheel => ({ car_id: carId, ...wheel })))
    .select()
}

// Suspension functions
export async function createCarSuspension(carId: string, suspensionData: {
  position?: 'front' | 'rear';
  suspension_type?: string;
  brand?: string;
  model?: string;
  spring_rate?: string;
  camber_degrees?: number;
  toe_degrees?: string;
  caster_degrees?: string;
}[]) {
  const supabase = createClient()
  
  // Delete existing suspension first
  await supabase.from('car_suspension').delete().eq('car_id', carId)
  
  // Insert new suspension
  return await supabase
    .from('car_suspension')
    .insert(suspensionData.map(susp => ({ car_id: carId, ...susp })))
    .select()
}

export async function deleteCar(carId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', carId)

    if (error) {
      console.error('Error deleting car:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting car:', error)
    return false
  }
}

export async function likeCar(carId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('car_likes')
      .select('id')
      .eq('car_id', carId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      return true // Already liked
    }

    // Add like
    const { error: likeError } = await supabase
      .from('car_likes')
      .insert({
        car_id: carId,
        user_id: userId,
      })

    if (likeError) {
      console.error('Error liking car:', likeError)
      return false
    }

    // Update car likes count
    const { error: updateError } = await supabase.rpc('increment_car_likes', { car_id: carId })

    if (updateError) {
      console.error('Error updating car likes count:', updateError)
    }

    return true
  } catch (error) {
    console.error('Error liking car:', error)
    return false
  }
}

export async function unlikeCar(carId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error: unlikeError } = await supabase
      .from('car_likes')
      .delete()
      .eq('car_id', carId)
      .eq('user_id', userId)

    if (unlikeError) {
      console.error('Error unliking car:', unlikeError)
      return false
    }

    // Update car likes count
    const { error: updateError } = await supabase.rpc('decrement_car_likes', { car_id: carId })

    if (updateError) {
      console.error('Error updating car likes count:', updateError)
    }

    return true
  } catch (error) {
    console.error('Error unliking car:', error)
    return false
  }
}

export async function isCarLiked(carId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { count } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId)
      .eq('user_id', userId)

    return (count || 0) > 0
  } catch (error) {
    console.error('Error checking car like status:', error)
    return false
  }
}
