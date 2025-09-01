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

// Comprehensive car update function for all components
export async function updateCarWithComponents(carId: string, carData: {
  // Basic car info
  brand?: string;
  model?: string;
  year?: number;
  images?: string[];
  
  // Engine data
  engine?: {
    engine_code?: string;
    displacement?: string;
    aspiration?: string;
    power_hp?: number;
    torque_nm?: number;
  };
  
  // Engine modifications
  engine_modifications?: {
    component: string;
    subcomponent?: string;
    brand?: string;
    model?: string;
    description?: string;
    is_custom?: boolean;
    tuned_by?: string;
  }[];
  
  // Wheels
  wheels?: {
    position: 'front' | 'rear';
    wheel_brand?: string;
    wheel_size?: string;
    wheel_offset?: string;
    tire_size?: string;
    camber_degrees?: number;
  }[];
  
  // Suspension
  suspension?: {
    position?: 'front' | 'rear';
    suspension_type?: string;
    brand?: string;
    model?: string;
    spring_rate?: string;
    camber_degrees?: number;
    toe_degrees?: string;
    caster_degrees?: string;
  }[];
  
  // Brakes
  brakes?: {
    position: 'front' | 'rear';
    caliper?: string;
    disc_size?: string;
    disc_type?: string;
    pads?: string;
  }[];
  
  // Exterior
  exterior?: {
    category: string;
    component?: string;
    brand?: string;
    model?: string;
    color?: string;
    type?: string;
    finish?: string;
    description?: string;
  }[];
  
  // Interior
  interior?: {
    category: string;
    position?: string;
    brand?: string;
    model?: string;
    size?: string;
    description?: string;
  }[];
  
  // Performance mods
  performance_mods?: {
    category: string;
    modification: string;
    brand?: string;
    model?: string;
    description?: string;
  }[];
}): Promise<Car | null> {
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
    
    // Update engine
    if (carData.engine) {
      await createCarEngine(carId, carData.engine);
    }
    
    // Update engine modifications
    if (carData.engine_modifications) {
      await createCarEngineModifications(carId, carData.engine_modifications);
    }
    
    // Update wheels
    if (carData.wheels) {
      await createCarWheels(carId, carData.wheels);
    }
    
    // Update suspension
    if (carData.suspension) {
      await createCarSuspension(carId, carData.suspension);
    }
    
    // Update brakes
    if (carData.brakes) {
      await createCarBrakes(carId, carData.brakes);
    }
    
    // Update exterior
    if (carData.exterior) {
      await createCarExterior(carId, carData.exterior);
    }
    
    // Update interior
    if (carData.interior) {
      await createCarInterior(carId, carData.interior);
    }
    
    // Update performance mods
    if (carData.performance_mods) {
      await createCarPerformanceMods(carId, carData.performance_mods);
    }
    
    // Return updated car with all components
    return await getCarById(carId);
  } catch (error) {
    console.error('Error updating car with components:', error);
    return null;
  }
}

// Create car with all components in one transaction
export async function createCarWithComponents(carData: {
  // Basic car info
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
  
  // Engine data
  engine?: {
    engine_code?: string;
    displacement?: string;
    aspiration?: string;
    power_hp?: number;
    torque_nm?: number;
  };
  
  // Engine modifications
  engine_modifications?: {
    component: string;
    subcomponent?: string;
    brand?: string;
    model?: string;
    description?: string;
    is_custom?: boolean;
    tuned_by?: string;
  }[];
  
  // Wheels
  wheels?: {
    position: 'front' | 'rear';
    wheel_brand?: string;
    wheel_size?: string;
    wheel_offset?: string;
    tire_size?: string;
    camber_degrees?: number;
  }[];
  
  // Suspension
  suspension?: {
    position?: 'front' | 'rear';
    suspension_type?: string;
    brand?: string;
    model?: string;
    spring_rate?: string;
    camber_degrees?: number;
    toe_degrees?: string;
    caster_degrees?: string;
  }[];
  
  // Brakes
  brakes?: {
    position: 'front' | 'rear';
    caliper?: string;
    disc_size?: string;
    disc_type?: string;
    pads?: string;
  }[];
  
  // Exterior
  exterior?: {
    category: string;
    component?: string;
    brand?: string;
    model?: string;
    color?: string;
    type?: string;
    finish?: string;
    description?: string;
  }[];
  
  // Interior
  interior?: {
    category: string;
    position?: string;
    brand?: string;
    model?: string;
    size?: string;
    description?: string;
  }[];
  
  // Performance mods
  performance_mods?: {
    category: string;
    modification: string;
    brand?: string;
    model?: string;
    description?: string;
  }[];
}): Promise<Car | null> {
  try {
    // Create basic car first
    const car = await createCar({
      owner_id: carData.owner_id,
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      images: carData.images || [],
    });
    
    if (!car) {
      throw new Error('Failed to create basic car');
    }
    
    const carId = car.id;
    
    // Create engine
    if (carData.engine) {
      await createCarEngine(carId, carData.engine);
    }
    
    // Create engine modifications
    if (carData.engine_modifications && carData.engine_modifications.length > 0) {
      await createCarEngineModifications(carId, carData.engine_modifications);
    }
    
    // Create wheels
    if (carData.wheels && carData.wheels.length > 0) {
      await createCarWheels(carId, carData.wheels);
    }
    
    // Create suspension
    if (carData.suspension && carData.suspension.length > 0) {
      await createCarSuspension(carId, carData.suspension);
    }
    
    // Create brakes
    if (carData.brakes && carData.brakes.length > 0) {
      await createCarBrakes(carId, carData.brakes);
    }
    
    // Create exterior
    if (carData.exterior && carData.exterior.length > 0) {
      await createCarExterior(carId, carData.exterior);
    }
    
    // Create interior
    if (carData.interior && carData.interior.length > 0) {
      await createCarInterior(carId, carData.interior);
    }
    
    // Create performance mods
    if (carData.performance_mods && carData.performance_mods.length > 0) {
      await createCarPerformanceMods(carId, carData.performance_mods);
    }
    
    // Return complete car with all components
    return await getCarById(carId);
  } catch (error) {
    console.error('Error creating car with components:', error);
    return null;
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

// Brake functions
export async function createCarBrakes(carId: string, brakesData: {
  position: 'front' | 'rear';
  caliper?: string;
  disc_size?: string;
  disc_type?: string;
  pads?: string;
}[]) {
  const supabase = createClient()
  
  // Delete existing brakes first
  await supabase.from('car_brakes').delete().eq('car_id', carId)
  
  // Insert new brakes
  return await supabase
    .from('car_brakes')
    .insert(brakesData.map(brake => ({ car_id: carId, ...brake })))
    .select()
}

// Engine modifications functions
export async function createCarEngineModifications(carId: string, modificationsData: {
  component: string;
  subcomponent?: string;
  brand?: string;
  model?: string;
  description?: string;
  is_custom?: boolean;
  tuned_by?: string;
}[]) {
  const supabase = createClient()
  
  // Delete existing modifications first
  await supabase.from('car_engine_modifications').delete().eq('car_id', carId)
  
  // Insert new modifications
  return await supabase
    .from('car_engine_modifications')
    .insert(modificationsData.map(mod => ({ car_id: carId, is_custom: false, ...mod })))
    .select()
}

// Exterior functions
export async function createCarExterior(carId: string, exteriorData: {
  category: string;
  component?: string;
  brand?: string;
  model?: string;
  color?: string;
  type?: string;
  finish?: string;
  description?: string;
}[]) {
  const supabase = createClient()
  
  // Delete existing exterior first
  await supabase.from('car_exterior').delete().eq('car_id', carId)
  
  // Insert new exterior
  return await supabase
    .from('car_exterior')
    .insert(exteriorData.map(ext => ({ car_id: carId, ...ext })))
    .select()
}

// Interior functions
export async function createCarInterior(carId: string, interiorData: {
  category: string;
  position?: string;
  brand?: string;
  model?: string;
  size?: string;
  description?: string;
}[]) {
  const supabase = createClient()
  
  // Delete existing interior first
  await supabase.from('car_interior').delete().eq('car_id', carId)
  
  // Insert new interior
  return await supabase
    .from('car_interior')
    .insert(interiorData.map(int => ({ car_id: carId, ...int })))
    .select()
}

// Performance mods functions
export async function createCarPerformanceMods(carId: string, performanceData: {
  category: string;
  modification: string;
  brand?: string;
  model?: string;
  description?: string;
}[]) {
  const supabase = createClient()
  
  // Delete existing performance mods first
  await supabase.from('car_performance_mods').delete().eq('car_id', carId)
  
  // Insert new performance mods
  return await supabase
    .from('car_performance_mods')
    .insert(performanceData.map(perf => ({ car_id: carId, ...perf })))
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
