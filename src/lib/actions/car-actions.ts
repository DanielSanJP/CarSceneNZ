'use server';

import { getAuthUser } from '@/lib/auth';
import { createClient } from '@/lib/utils/supabase/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { Car } from '@/types';
import { deleteMultipleCarImagesAction } from './delete-actions';

export async function likeCarAction(carId: string) {
  try {
    // Get user authentication
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: "Authentication required" };
    }

    if (!carId) {
      return { success: false, error: "Car ID is required" };
    }

    const supabase = await createClient();

    console.log(`🔄 Server Action: Toggling like for car ${carId}, user ${authUser.id}`);

    // 1. Check if user already liked this car
    const { data: existingLike, error: checkError } = await supabase
      .from('car_likes')
      .select('id')
      .eq('car_id', carId)
      .eq('user_id', authUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing like:', checkError);
      return { success: false, error: 'Failed to check like status' };
    }

    let isLiked = false;
    let newLikeCount = 0;

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('car_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) {
        console.error('❌ Error removing like:', deleteError);
        return { success: false, error: 'Failed to remove like' };
      }

      console.log(`👎 Removed like for car ${carId}`);
      isLiked = false;
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from('car_likes')
        .insert({
          car_id: carId,
          user_id: authUser.id
        });

      if (insertError) {
        console.error('❌ Error adding like:', insertError);
        return { success: false, error: 'Failed to add like' };
      }

      console.log(`👍 Added like for car ${carId}`);
      isLiked = true;
    }

    // 2. Get updated like count
    const { count: likeCount, error: countError } = await supabase
      .from('car_likes')
      .select('*', { count: 'exact', head: true })
      .eq('car_id', carId);

    if (countError) {
      console.error('❌ Error getting like count:', countError);
      return { success: false, error: 'Failed to get updated like count' };
    }

    newLikeCount = likeCount || 0;

    // 3. Update the car's total_likes
    const { error: updateError } = await supabase
      .from('cars')
      .update({ total_likes: newLikeCount })
      .eq('id', carId);

    if (updateError) {
      console.error('❌ Error updating car total_likes:', updateError);
      return { success: false, error: 'Failed to update car likes count' };
    }

    console.log(`✅ Updated car ${carId} total_likes to ${newLikeCount}`);

    // Note: Club total_likes will be automatically calculated by the club_stats view
    // No need to manually update club totals anymore

    // Server Actions immediately invalidate both Data Cache AND Router Cache
    revalidatePath('/garage/[id]', 'page');
    revalidatePath(`/garage/${carId}`);
    revalidatePath('/garage');
    revalidatePath('/garage/my-garage');
    revalidatePath('/clubs'); // Club rankings may have changed
    revalidatePath('/leaderboards'); // Leaderboards may have changed due to club ranking updates
    revalidatePath('/api/leaderboards'); // Revalidate leaderboards API
    revalidatePath('/'); // Homepage might show liked cars
    
    revalidateTag(`car-${carId}`);
    revalidateTag('cars');
    revalidateTag('garage');
    revalidateTag('clubs'); // Invalidate clubs cache since rankings may change
    revalidateTag('leaderboards'); // Invalidate leaderboards cache since club rankings may change
    revalidateTag(`user-${authUser.id}-likes`);
    
    console.log(`🔄 Server Action: Cache invalidated for car ${carId} like toggle`);

    return { 
      success: true, 
      isLiked, 
      likeCount: newLikeCount 
    };

  } catch (error) {
    console.error('❌ Error in like car action:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Server action for updating a car with all its components
 */
export async function updateCarWithComponentsAction(
  carId: string,
  carData: Record<string, string | number | unknown[] | undefined>
): Promise<Car | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cars")
      .update({
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        images: carData.images,
        // Add all flattened fields
        engine_code: carData.engine_code || null,
        displacement: carData.displacement || null,
        aspiration: carData.aspiration || null,
        power_hp: carData.power_hp || null,
        torque_nm: carData.torque_nm || null,
        ecu: carData.ecu || null,
        tuned_by: carData.tuned_by || null,
        pistons: carData.pistons || null,
        connecting_rods: carData.connecting_rods || null,
        valves: carData.valves || null,
        valve_springs: carData.valve_springs || null,
        camshafts: carData.camshafts || null,
        header: carData.header || null,
        exhaust: carData.exhaust || null,
        intake: carData.intake || null,
        turbo: carData.turbo || null,
        intercooler: carData.intercooler || null,
        fuel_injectors: carData.fuel_injectors || null,
        fuel_pump: carData.fuel_pump || null,
        fuel_rail: carData.fuel_rail || null,
        head_unit: carData.head_unit || null,
        speakers: carData.speakers || null,
        subwoofer: carData.subwoofer || null,
        amplifier: carData.amplifier || null,
        front_bumper: carData.front_bumper || null,
        front_lip: carData.front_lip || null,
        rear_bumper: carData.rear_bumper || null,
        rear_lip: carData.rear_lip || null,
        side_skirts: carData.side_skirts || null,
        rear_spoiler: carData.rear_spoiler || null,
        diffuser: carData.diffuser || null,
        fender_flares: carData.fender_flares || null,
        hood: carData.hood || null,
        paint_color: carData.paint_color || null,
        paint_finish: carData.paint_finish || null,
        wrap_brand: carData.wrap_brand || null,
        wrap_color: carData.wrap_color || null,
        front_seats: carData.front_seats || null,
        rear_seats: carData.rear_seats || null,
        steering_wheel: carData.steering_wheel || null,
        headlights: carData.headlights || null,
        taillights: carData.taillights || null,
        fog_lights: carData.fog_lights || null,
        underglow: carData.underglow || null,
        interior_lighting: carData.interior_lighting || null,
        // JSON fields
        brakes: carData.brakes || null,
        suspension: carData.suspension || null,
        wheels: carData.wheels || null,
        gauges: carData.gauges || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carId)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating car:", error);
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
      owner: {
        id: data.owner_id,
        username: "",
        display_name: "",
        profile_image_url: undefined,
      },
    };
  } catch (error) {
    console.error("Error updating car:", error);
    return null;
  }
}

/**
 * Server action for deleting a car and all its associated images
 */
export async function deleteCarAction(carId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // First, get the car's images to clean them up
    const { data: carData, error: fetchError } = await supabase
      .from("cars")
      .select("images")
      .eq("id", carId)
      .single();

    if (fetchError) {
      console.error("Error fetching car for deletion:", fetchError);
      return false;
    }

    // Clean up all car images from storage before deleting the record
    if (carData?.images && carData.images.length > 0) {
      try {
        const result = await deleteMultipleCarImagesAction(carData.images);
        console.log(
          `🗑️ Car Delete: Cleaned up ${result.successCount}/${carData.images.length} images`
        );
        if (result.error) {
          console.warn("Warning during image cleanup:", result.error);
        }
      } catch (cleanupError) {
        console.error("Error cleaning up car images:", cleanupError);
        // Continue with deletion even if image cleanup fails
      }
    }

    // Now delete the car record
    const { error } = await supabase.from("cars").delete().eq("id", carId);

    if (error) {
      console.error("Error deleting car:", error);
      return false;
    }

    console.log(
      `✅ Car Delete: Successfully deleted car ${carId} and its images`
    );
    return true;
  } catch (error) {
    console.error("Error deleting car:", error);
    return false;
  }
}

/**
 * Server action for creating a car with all its components
 */
export async function createCarWithComponentsAction(carData: {
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images: string[];
  [key: string]: unknown; // Allow any additional flattened fields
}): Promise<Car | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cars")
      .insert({
        owner_id: carData.owner_id,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        images: carData.images,
        // Add all flattened fields
        engine_code: carData.engine_code || null,
        displacement: carData.displacement || null,
        aspiration: carData.aspiration || null,
        power_hp: carData.power_hp || null,
        torque_nm: carData.torque_nm || null,
        ecu: carData.ecu || null,
        tuned_by: carData.tuned_by || null,
        pistons: carData.pistons || null,
        connecting_rods: carData.connecting_rods || null,
        valves: carData.valves || null,
        valve_springs: carData.valve_springs || null,
        camshafts: carData.camshafts || null,
        header: carData.header || null,
        exhaust: carData.exhaust || null,
        intake: carData.intake || null,
        turbo: carData.turbo || null,
        intercooler: carData.intercooler || null,
        fuel_injectors: carData.fuel_injectors || null,
        fuel_pump: carData.fuel_pump || null,
        fuel_rail: carData.fuel_rail || null,
        head_unit: carData.head_unit || null,
        speakers: carData.speakers || null,
        subwoofer: carData.subwoofer || null,
        amplifier: carData.amplifier || null,
        front_bumper: carData.front_bumper || null,
        front_lip: carData.front_lip || null,
        rear_bumper: carData.rear_bumper || null,
        rear_lip: carData.rear_lip || null,
        side_skirts: carData.side_skirts || null,
        rear_spoiler: carData.rear_spoiler || null,
        diffuser: carData.diffuser || null,
        fender_flares: carData.fender_flares || null,
        hood: carData.hood || null,
        paint_color: carData.paint_color || null,
        paint_finish: carData.paint_finish || null,
        wrap_brand: carData.wrap_brand || null,
        wrap_color: carData.wrap_color || null,
        front_seats: carData.front_seats || null,
        rear_seats: carData.rear_seats || null,
        steering_wheel: carData.steering_wheel || null,
        headlights: carData.headlights || null,
        taillights: carData.taillights || null,
        fog_lights: carData.fog_lights || null,
        underglow: carData.underglow || null,
        interior_lighting: carData.interior_lighting || null,
        // JSON fields
        brakes: carData.brakes || null,
        suspension: carData.suspension || null,
        wheels: carData.wheels || null,
        gauges: carData.gauges || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Error creating car:", error);
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
      owner: {
        id: data.owner_id,
        username: "",
        display_name: "",
        profile_image_url: undefined,
      },
    };
  } catch (error) {
    console.error("Error creating car:", error);
    return null;
  }
}