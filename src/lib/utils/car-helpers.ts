import type { Car, CarWheel, CarSuspension, CarBrake, CarGauge, CarEngine } from '@/types/car';

// Helper function to extract engine data from flattened car
export function getEngineData(car: Car): CarEngine {
  return {
    engine_code: car.engine_code,
    displacement: car.displacement,
    aspiration: car.aspiration,
    power_hp: car.power_hp,
    torque_nm: car.torque_nm,
  };
}

// Helper functions to convert flattened data to array format for backwards compatibility
export function getWheelsByPosition(car: Car): CarWheel[] {
  const wheels: CarWheel[] = [];
  
  if (car.wheels?.front) {
    wheels.push({
      id: `${car.id}-front`,
      position: 'front',
      ...car.wheels.front,
    });
  }
  
  if (car.wheels?.rear) {
    wheels.push({
      id: `${car.id}-rear`,
      position: 'rear',
      ...car.wheels.rear,
    });
  }
  
  return wheels;
}

export function getSuspensionByPosition(car: Car): CarSuspension[] {
  const suspension: CarSuspension[] = [];
  
  if (car.suspension?.front) {
    suspension.push({
      id: `${car.id}-front`,
      position: 'front',
      ...car.suspension.front,
    });
  }
  
  if (car.suspension?.rear) {
    suspension.push({
      id: `${car.id}-rear`,
      position: 'rear',
      ...car.suspension.rear,
    });
  }
  
  return suspension;
}

export function getBrakesByPosition(car: Car): CarBrake[] {
  const brakes: CarBrake[] = [];
  
  if (car.brakes?.front) {
    brakes.push({
      id: `${car.id}-front`,
      position: 'front',
      ...car.brakes.front,
    });
  }
  
  if (car.brakes?.rear) {
    brakes.push({
      id: `${car.id}-rear`,
      position: 'rear',
      ...car.brakes.rear,
    });
  }
  
  return brakes;
}

export function getGaugesArray(car: Car): CarGauge[] {
  if (!car.gauges || !Array.isArray(car.gauges)) {
    return [];
  }
  
  return car.gauges.map((gauge, index) => ({
    id: gauge.id || `${car.id}-gauge-${index}`,
    gauge_type: gauge.gauge_type || '',
    brand: gauge.brand,
    ...gauge,
  }));
}

// Helper function to check if engine data has any meaningful information
export function hasEngineData(engineData: CarEngine | null | undefined): boolean {
  if (!engineData) return false;
  
  return !!(
    engineData.engine_code ||
    engineData.displacement ||
    engineData.aspiration ||
    (engineData.power_hp && engineData.power_hp > 0) ||
    (engineData.torque_nm && engineData.torque_nm > 0)
  );
}
