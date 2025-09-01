import type {
  CarWheel,
  CarSuspension,
  CarBrake,
} from '@/types/car';
import {
  getRecordsByCarId,
  upsertRecords,
  deleteRecordsByCarId,
} from './crud-helpers';

// Form data types (without database fields)
type WheelFormData = Omit<CarWheel, 'id' | 'car_id' | 'created_at' | 'updated_at'>;
type SuspensionFormData = Omit<CarSuspension, 'id' | 'car_id' | 'created_at' | 'updated_at'>;
type BrakeFormData = Omit<CarBrake, 'id' | 'car_id' | 'created_at' | 'updated_at'>;

// Chassis component data interface for form handling
export interface ChassisComponentsData {
  wheels?: WheelFormData[];
  suspension?: SuspensionFormData[];
  brakes?: BrakeFormData[];
}

/**
 * Get all chassis-related components for a car
 */
export async function getChassisComponents(carId: string): Promise<{
  wheels?: CarWheel[];
  suspension?: CarSuspension[];
  brakes?: CarBrake[];
}> {
  try {
    const [wheels, suspension, brakes] = await Promise.all([
      getRecordsByCarId<CarWheel>('car_wheels', carId),
      getRecordsByCarId<CarSuspension>('car_suspension', carId),
      getRecordsByCarId<CarBrake>('car_brakes', carId),
    ]);

    return {
      wheels: wheels.length > 0 ? wheels : undefined,
      suspension: suspension.length > 0 ? suspension : undefined,
      brakes: brakes.length > 0 ? brakes : undefined,
    };
  } catch (error) {
    console.error('Error fetching chassis components:', error);
    return {};
  }
}

/**
 * Update all chassis components for a car
 */
export async function updateChassisComponents(
  carId: string,
  data: ChassisComponentsData
): Promise<boolean> {
  try {
    const updatePromises: Promise<unknown>[] = [];

    // Update wheels (front/rear positions)
    if (data.wheels && data.wheels.length > 0) {
      updatePromises.push(
        upsertRecords('car_wheels', carId, data.wheels)
      );
    }

    // Update suspension (front/rear/general positions)
    if (data.suspension && data.suspension.length > 0) {
      updatePromises.push(
        upsertRecords('car_suspension', carId, data.suspension)
      );
    }

    // Update brakes (front/rear positions)
    if (data.brakes && data.brakes.length > 0) {
      updatePromises.push(
        upsertRecords('car_brakes', carId, data.brakes)
      );
    }

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating chassis components:', error);
    return false;
  }
}

/**
 * Delete all chassis components for a car (for cleanup)
 */
export async function deleteChassisComponents(carId: string): Promise<boolean> {
  try {
    const deletePromises = [
      deleteRecordsByCarId('car_wheels', carId),
      deleteRecordsByCarId('car_suspension', carId),
      deleteRecordsByCarId('car_brakes', carId),
    ];

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting chassis components:', error);
    return false;
  }
}

/**
 * Helper functions for common chassis operations
 */

// Get wheels by position
export function getWheelsByPosition(
  wheels: CarWheel[] | undefined,
  position: 'front' | 'rear'
): CarWheel | undefined {
  return wheels?.find(wheel => wheel.position === position);
}

// Get suspension by position
export function getSuspensionByPosition(
  suspension: CarSuspension[] | undefined,
  position: 'front' | 'rear'
): CarSuspension | undefined {
  return suspension?.find(susp => susp.position === position);
}

// Get brakes by position
export function getBrakesByPosition(
  brakes: CarBrake[] | undefined,
  position: 'front' | 'rear'
): CarBrake | undefined {
  return brakes?.find(brake => brake.position === position);
}
