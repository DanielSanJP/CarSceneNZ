import { createClient } from '@/lib/utils/supabase/server'
import type { Car } from '@/types/car'

export async function getAllCars(): Promise<Car[]> {
  try {
    const supabase = await createClient()

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
      suspension_type: car.suspension_type,
      wheel_specs: car.wheel_specs,
      tire_specs: car.tire_specs,
      engine: car.engine,
      suspension: car.suspension,
      brakes: car.brakes,
      exterior: car.exterior,
      interior: car.interior,
      performance_mods: car.performance_mods,
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
    })) || []
  } catch (error) {
    console.error('Error getting all cars:', error)
    return []
  }
}

export async function getCarById(carId: string): Promise<Car | null> {
  try {
    const supabase = await createClient()

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
      suspension_type: data.suspension_type,
      wheel_specs: data.wheel_specs,
      tire_specs: data.tire_specs,
      engine: data.engine,
      suspension: data.suspension,
      brakes: data.brakes,
      exterior: data.exterior,
      interior: data.interior,
      performance_mods: data.performance_mods,
      images: data.images || [],
      total_likes: data.total_likes || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      owner: {
        id: data.users.id,
        username: data.users.username,
        display_name: data.users.display_name || data.users.username,
        profile_image_url: data.users.profile_image_url,
      }
    }
  } catch (error) {
    console.error('Error getting car by ID:', error)
    return null
  }
}

export async function getCarsByOwner(ownerId: string): Promise<Car[]> {
  try {
    const supabase = await createClient()

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
      suspension_type: car.suspension_type,
      wheel_specs: car.wheel_specs,
      tire_specs: car.tire_specs,
      engine: car.engine,
      suspension: car.suspension,
      brakes: car.brakes,
      exterior: car.exterior,
      interior: car.interior,
      performance_mods: car.performance_mods,
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
    })) || []
  } catch (error) {
    console.error('Error getting cars by owner:', error)
    return []
  }
}

export async function createCar(carData: Omit<Car, 'id' | 'created_at' | 'updated_at' | 'total_likes' | 'owner'>): Promise<Car | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cars')
      .insert({
        owner_id: carData.owner_id,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        suspension_type: carData.suspension_type,
        wheel_specs: carData.wheel_specs,
        tire_specs: carData.tire_specs,
        engine: carData.engine,
        suspension: carData.suspension,
        brakes: carData.brakes,
        exterior: carData.exterior,
        interior: carData.interior,
        performance_mods: carData.performance_mods,
        images: carData.images,
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

export async function updateCar(carId: string, updates: Partial<Omit<Car, 'id' | 'created_at' | 'updated_at' | 'total_likes' | 'owner'>>): Promise<Car | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('cars')
      .update({
        brand: updates.brand,
        model: updates.model,
        year: updates.year,
        suspension_type: updates.suspension_type,
        wheel_specs: updates.wheel_specs,
        tire_specs: updates.tire_specs,
        engine: updates.engine,
        suspension: updates.suspension,
        brakes: updates.brakes,
        exterior: updates.exterior,
        interior: updates.interior,
        performance_mods: updates.performance_mods,
        images: updates.images,
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

export async function deleteCar(carId: string): Promise<boolean> {
  try {
    const supabase = await createClient()

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
    const supabase = await createClient()

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
    const supabase = await createClient()

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
    const supabase = await createClient()

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
