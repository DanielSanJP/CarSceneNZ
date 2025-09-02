import type {
  CarSeats,
  CarSteeringWheel,
  CarAudioSystem,
  CarGauges,
} from '@/types/car';
import {
  getRecordByCarId,
  getRecordsByCarId,
  upsertRecord,
  upsertRecords,
  deleteRecordsByCarId,
} from './crud-helpers';

// Interior component data interface for form handling
export interface InteriorComponentsData {
  seats?: Partial<CarSeats>;
  steering_wheel?: Partial<CarSteeringWheel>;
  audio_system?: Partial<CarAudioSystem>;
  gauges?: CarGauges[];
}

/**
 * Get all interior-related components for a car
 */
export async function getInteriorComponents(carId: string): Promise<{
  seats?: CarSeats;
  steering_wheel?: CarSteeringWheel;
  audio_system?: CarAudioSystem;
  gauges?: CarGauges[];
}> {
  try {
    const [seats, steeringWheel, audioSystem, gauges] = await Promise.all([
      getRecordByCarId<CarSeats>('car_seats', carId),
      getRecordByCarId<CarSteeringWheel>('car_steering_wheel', carId),
      getRecordByCarId<CarAudioSystem>('car_audio_system', carId),
      getRecordsByCarId<CarGauges>('car_gauges', carId),
    ]);

    return {
      seats: seats || undefined,
      steering_wheel: steeringWheel || undefined,
      audio_system: audioSystem || undefined,
      gauges: gauges.length > 0 ? gauges : undefined,
    };
  } catch (error) {
    console.error('Error fetching interior components:', error);
    return {};
  }
}

/**
 * Check if an object has any meaningful (non-empty, non-null, non-undefined) values
 */
function hasValidValues(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some(value => 
    value !== null && 
    value !== undefined && 
    value !== '' && 
    (typeof value !== 'number' || value > 0)
  );
}

/**
 * Update all interior components for a car
 */
export async function updateInteriorComponents(
  carId: string,
  data: InteriorComponentsData
): Promise<boolean> {
  try {
    const updatePromises: Promise<unknown>[] = [];

    // Update seats
    if (data.seats && hasValidValues(data.seats)) {
      updatePromises.push(
        upsertRecord<CarSeats>('car_seats', carId, data.seats)
      );
    }

    // Update steering wheel
    if (data.steering_wheel && hasValidValues(data.steering_wheel)) {
      updatePromises.push(
        upsertRecord<CarSteeringWheel>('car_steering_wheel', carId, data.steering_wheel)
      );
    }

    // Update audio system
    if (data.audio_system && hasValidValues(data.audio_system)) {
      updatePromises.push(
        upsertRecord<CarAudioSystem>('car_audio_system', carId, data.audio_system)
      );
    }

    // Update gauges (multiple allowed)
    if (data.gauges && data.gauges.length > 0) {
      updatePromises.push(
        upsertRecords<CarGauges>('car_gauges', carId, data.gauges)
      );
    }

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating interior components:', error);
    return false;
  }
}

/**
 * Delete all interior components for a car (for cleanup)
 */
export async function deleteInteriorComponents(carId: string): Promise<boolean> {
  try {
    const deletePromises = [
      deleteRecordsByCarId('car_seats', carId),
      deleteRecordsByCarId('car_steering_wheel', carId),
      deleteRecordsByCarId('car_audio_system', carId),
      deleteRecordsByCarId('car_gauges', carId),
    ];

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting interior components:', error);
    return false;
  }
}
