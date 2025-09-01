import type {
  CarEngine,
  CarTurboSystem,
  CarExhaustSystem,
  CarEngineManagement,
  CarInternalComponents,
  CarFuelSystem,
} from '@/types/car';
import {
  getRecordByCarId,
  upsertRecord,
  deleteRecordsByCarId,
} from './crud-helpers';

// Engine component data interface for form handling
export interface EngineComponentsData {
  engine?: Partial<CarEngine>;
  turbo_system?: Partial<CarTurboSystem>;
  exhaust_system?: Partial<CarExhaustSystem>;
  engine_management?: Partial<CarEngineManagement>;
  internal_components?: Partial<CarInternalComponents>;
  fuel_system?: Partial<CarFuelSystem>;
}

/**
 * Get all engine-related components for a car
 */
export async function getEngineComponents(carId: string): Promise<{
  engine?: CarEngine;
  turbo_system?: CarTurboSystem;
  exhaust_system?: CarExhaustSystem;
  engine_management?: CarEngineManagement;
  internal_components?: CarInternalComponents;
  fuel_system?: CarFuelSystem;
}> {
  try {
    const [
      engine,
      turboSystem,
      exhaustSystem,
      engineManagement,
      internalComponents,
      fuelSystem,
    ] = await Promise.all([
      getRecordByCarId<CarEngine>('car_engines', carId),
      getRecordByCarId<CarTurboSystem>('car_turbo_system', carId),
      getRecordByCarId<CarExhaustSystem>('car_exhaust_system', carId),
      getRecordByCarId<CarEngineManagement>('car_engine_management', carId),
      getRecordByCarId<CarInternalComponents>('car_internal_components', carId),
      getRecordByCarId<CarFuelSystem>('car_fuel_system', carId),
    ]);

    return {
      engine: engine || undefined,
      turbo_system: turboSystem || undefined,
      exhaust_system: exhaustSystem || undefined,
      engine_management: engineManagement || undefined,
      internal_components: internalComponents || undefined,
      fuel_system: fuelSystem || undefined,
    };
  } catch (error) {
    console.error('Error fetching engine components:', error);
    return {};
  }
}

/**
 * Update all engine components for a car
 */
export async function updateEngineComponents(
  carId: string,
  data: EngineComponentsData
): Promise<boolean> {
  try {
    const updatePromises: Promise<unknown>[] = [];

    // Update each component if data is provided
    if (data.engine && Object.keys(data.engine).length > 0) {
      updatePromises.push(
        upsertRecord<CarEngine>('car_engines', carId, data.engine)
      );
    }

    if (data.turbo_system && Object.keys(data.turbo_system).length > 0) {
      updatePromises.push(
        upsertRecord<CarTurboSystem>('car_turbo_system', carId, data.turbo_system)
      );
    }

    if (data.exhaust_system && Object.keys(data.exhaust_system).length > 0) {
      updatePromises.push(
        upsertRecord<CarExhaustSystem>('car_exhaust_system', carId, data.exhaust_system)
      );
    }

    if (data.engine_management && Object.keys(data.engine_management).length > 0) {
      updatePromises.push(
        upsertRecord<CarEngineManagement>('car_engine_management', carId, data.engine_management)
      );
    }

    if (data.internal_components && Object.keys(data.internal_components).length > 0) {
      updatePromises.push(
        upsertRecord<CarInternalComponents>('car_internal_components', carId, data.internal_components)
      );
    }

    if (data.fuel_system && Object.keys(data.fuel_system).length > 0) {
      updatePromises.push(
        upsertRecord<CarFuelSystem>('car_fuel_system', carId, data.fuel_system)
      );
    }

    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error('Error updating engine components:', error);
    return false;
  }
}

/**
 * Delete all engine components for a car (for cleanup)
 */
export async function deleteEngineComponents(carId: string): Promise<boolean> {
  try {
    const deletePromises = [
      deleteRecordsByCarId('car_engines', carId),
      deleteRecordsByCarId('car_turbo_system', carId),
      deleteRecordsByCarId('car_exhaust_system', carId),
      deleteRecordsByCarId('car_engine_management', carId),
      deleteRecordsByCarId('car_internal_components', carId),
      deleteRecordsByCarId('car_fuel_system', carId),
    ];

    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting engine components:', error);
    return false;
  }
}
