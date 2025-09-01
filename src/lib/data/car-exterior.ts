import type {
  CarPaintFinish,
  CarLightingModifications,
  CarBodykitModifications,
} from '@/types/car';
import {
  getRecordByCarId,
  upsertRecord,
  deleteRecordsByCarId,
} from './crud-helpers';

// Exterior component data interface for form handling
export interface ExteriorComponentsData {
  paint_finish?: Partial<CarPaintFinish>;
  lighting_modifications?: Partial<CarLightingModifications>;
  bodykit_modifications?: Partial<CarBodykitModifications>;
}

/**
 * Get all exterior-related components for a car
 */
export async function getExteriorComponents(carId: string): Promise<{
  paint_finish?: CarPaintFinish;
  lighting_modifications?: CarLightingModifications;
  bodykit_modifications?: CarBodykitModifications;
}> {
  try {
    const [paintFinish, lightingMods, bodykitMods] = await Promise.all([
      getRecordByCarId<CarPaintFinish>('car_paint_finish', carId),
      getRecordByCarId<CarLightingModifications>('car_lighting_modifications', carId),
      getRecordByCarId<CarBodykitModifications>('car_bodykit_modifications', carId),
    ]);

    return {
      paint_finish: paintFinish || undefined,
      lighting_modifications: lightingMods || undefined,
      bodykit_modifications: bodykitMods || undefined,
    };
  } catch (error) {
    console.error('Error fetching exterior components:', error);
    return {};
  }
}

/**
 * Update all exterior components for a car
 */
export async function updateExteriorComponents(
  carId: string,
  data: ExteriorComponentsData
): Promise<boolean> {
  try {
    const updatePromises: Promise<unknown>[] = [];

    // Update paint and finish
    if (data.paint_finish && Object.keys(data.paint_finish).length > 0) {
      updatePromises.push(
        upsertRecord<CarPaintFinish>('car_paint_finish', carId, data.paint_finish)
      );
    }

    // Update lighting modifications
    if (data.lighting_modifications && Object.keys(data.lighting_modifications).length > 0) {
      updatePromises.push(
        upsertRecord<CarLightingModifications>('car_lighting_modifications', carId, data.lighting_modifications)
      );
    }

    // Update bodykit modifications
    if (data.bodykit_modifications && Object.keys(data.bodykit_modifications).length > 0) {
      updatePromises.push(
        upsertRecord<CarBodykitModifications>('car_bodykit_modifications', carId, data.bodykit_modifications)
      );
    }

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating exterior components:', error);
    return false;
  }
}

/**
 * Delete all exterior components for a car (for cleanup)
 */
export async function deleteExteriorComponents(carId: string): Promise<boolean> {
  try {
    const deletePromises = [
      deleteRecordsByCarId('car_paint_finish', carId),
      deleteRecordsByCarId('car_lighting_modifications', carId),
      deleteRecordsByCarId('car_bodykit_modifications', carId),
    ];

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting exterior components:', error);
    return false;
  }
}
