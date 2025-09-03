// 'use server';

import { cache } from 'react';
import type {
  CarEngine,
  CarTurboSystem,
  CarExhaustSystem,
  CarEngineManagement,
  CarInternalComponents,
  CarFuelSystem,
  CarWheel,
  CarSuspension,
  CarBrake,
  CarPaintFinish,
  CarLightingModifications,
  CarBodykitModifications,
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Engine component data interface for form handling
export interface EngineComponentsData {
  engine?: Partial<CarEngine>;
  turbo_system?: Partial<CarTurboSystem>;
  exhaust_system?: Partial<CarExhaustSystem>;
  engine_management?: Partial<CarEngineManagement>;
  internal_components?: Partial<CarInternalComponents>;
  fuel_system?: Partial<CarFuelSystem>;
}

// Form data types for chassis (without database fields)
type WheelFormData = Omit<CarWheel, 'id' | 'car_id' | 'created_at' | 'updated_at'>;
type SuspensionFormData = Omit<CarSuspension, 'id' | 'car_id' | 'created_at' | 'updated_at'>;
type BrakeFormData = Omit<CarBrake, 'id' | 'car_id' | 'created_at' | 'updated_at'>;

// Chassis component data interface for form handling
export interface ChassisComponentsData {
  wheels?: WheelFormData[];
  suspension?: SuspensionFormData[];
  brakes?: BrakeFormData[];
}

// Exterior component data interface for form handling
export interface ExteriorComponentsData {
  paint_finish?: Partial<CarPaintFinish>;
  lighting_modifications?: Partial<CarLightingModifications>;
  bodykit_modifications?: Partial<CarBodykitModifications>;
}

// Interior component data interface for form handling
export interface InteriorComponentsData {
  seats?: Partial<CarSeats>;
  steering_wheel?: Partial<CarSteeringWheel>;
  audio_system?: Partial<CarAudioSystem>;
  gauges?: CarGauges[];
}

// Combined components interface
export interface AllCarComponentsData {
  engine?: EngineComponentsData;
  chassis?: ChassisComponentsData;
  exterior?: ExteriorComponentsData;
  interior?: InteriorComponentsData;
}

// ============================================================================
// ENGINE COMPONENTS
// ============================================================================

/**
 * Get all engine-related components for a car (server-cached)
 */
export const getEngineComponents = cache(async (carId: string): Promise<{
  engine?: CarEngine;
  turbo_system?: CarTurboSystem;
  exhaust_system?: CarExhaustSystem;
  engine_management?: CarEngineManagement;
  internal_components?: CarInternalComponents;
  fuel_system?: CarFuelSystem;
}> => {
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
});

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

// ============================================================================
// CHASSIS COMPONENTS
// ============================================================================

/**
 * Get all chassis-related components for a car (server-cached)
 */
export const getChassisComponents = cache(async (carId: string): Promise<{
  wheels?: CarWheel[];
  suspension?: CarSuspension[];
  brakes?: CarBrake[];
}> => {
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
});

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

// ============================================================================
// EXTERIOR COMPONENTS
// ============================================================================

/**
 * Get all exterior-related components for a car (server-cached)
 */
export const getExteriorComponents = cache(async (carId: string): Promise<{
  paint_finish?: CarPaintFinish;
  lighting_modifications?: CarLightingModifications;
  bodykit_modifications?: CarBodykitModifications;
}> => {
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
});

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

// ============================================================================
// INTERIOR COMPONENTS
// ============================================================================

/**
 * Get all interior-related components for a car (server-cached)
 */
export const getInteriorComponents = cache(async (carId: string): Promise<{
  seats?: CarSeats;
  steering_wheel?: CarSteeringWheel;
  audio_system?: CarAudioSystem;
  gauges?: CarGauges[];
}> => {
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
});

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

// ============================================================================
// COMBINED OPERATIONS
// ============================================================================

/**
 * Get ALL car components in a single cached call (optimized for display)
 */
export const getAllCarComponents = cache(async (carId: string): Promise<{
  engine: Awaited<ReturnType<typeof getEngineComponents>>;
  chassis: Awaited<ReturnType<typeof getChassisComponents>>;
  exterior: Awaited<ReturnType<typeof getExteriorComponents>>;
  interior: Awaited<ReturnType<typeof getInteriorComponents>>;
}> => {
  try {
    const [engine, chassis, exterior, interior] = await Promise.all([
      getEngineComponents(carId),
      getChassisComponents(carId),
      getExteriorComponents(carId),
      getInteriorComponents(carId),
    ]);

    return {
      engine,
      chassis,
      exterior,
      interior,
    };
  } catch (error) {
    console.error('Error fetching all car components:', error);
    return {
      engine: {},
      chassis: {},
      exterior: {},
      interior: {},
    };
  }
});

/**
 * Update all car components in a single transaction
 */
export async function updateAllCarComponents(
  carId: string,
  data: AllCarComponentsData
): Promise<boolean> {
  try {
    const updatePromises: Promise<boolean>[] = [];

    if (data.engine) {
      updatePromises.push(updateEngineComponents(carId, data.engine));
    }

    if (data.chassis) {
      updatePromises.push(updateChassisComponents(carId, data.chassis));
    }

    if (data.exterior) {
      updatePromises.push(updateExteriorComponents(carId, data.exterior));
    }

    if (data.interior) {
      updatePromises.push(updateInteriorComponents(carId, data.interior));
    }

    const results = await Promise.all(updatePromises);
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error updating all car components:', error);
    return false;
  }
}

/**
 * Delete all car components (for car deletion cleanup)
 */
export async function deleteAllCarComponents(carId: string): Promise<boolean> {
  try {
    const deletePromises = [
      deleteEngineComponents(carId),
      deleteChassisComponents(carId),
      deleteExteriorComponents(carId),
      deleteInteriorComponents(carId),
    ];

    const results = await Promise.all(deletePromises);
    return results.every(result => result === true);
  } catch (error) {
    console.error('Error deleting all car components:', error);
    return false;
  }
}
