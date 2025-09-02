// Engine and Engine-related Components
export interface CarEngine {
  id: string;
  car_id: string;
  engine_code?: string;
  displacement?: string;
  aspiration?: string;
  power_hp?: number;
  torque_nm?: number;
  created_at: string;
  updated_at: string;
}

export interface CarTurboSystem {
  id: string;
  car_id: string;
  turbo?: string;
  intercooler?: string;
  created_at: string;
  updated_at: string;
}

export interface CarExhaustSystem {
  id: string;
  car_id: string;
  header?: string;
  exhaust?: string;
  intake?: string;
  created_at: string;
  updated_at: string;
}

export interface CarEngineManagement {
  id: string;
  car_id: string;
  ecu?: string;
  tuned_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CarInternalComponents {
  id: string;
  car_id: string;
  pistons?: string;
  connecting_rods?: string;
  valves?: string;
  valve_springs?: string;
  camshafts?: string;
  created_at: string;
  updated_at: string;
}

export interface CarFuelSystem {
  id: string;
  car_id: string;
  fuel_injectors?: string;
  fuel_pump?: string;
  fuel_rail?: string;
  created_at: string;
  updated_at: string;
}

// Chassis Components
export interface CarWheel {
  id: string;
  car_id: string;
  position: 'front' | 'rear';
  wheel?: string;
  wheel_size?: string;
  wheel_offset?: string;
  tyre?: string;
  tyre_size?: string;
  created_at: string;
  updated_at: string;
}

export interface CarSuspension {
  id: string;
  car_id: string;
  position?: 'front' | 'rear'; // nullable for general suspension_type
  suspension_type?: string;
  suspension?: string;
  spring_rate?: string;
  camber_degrees?: number;
  toe_degrees?: string;
  caster_degrees?: string;
  // Position-specific suspension accessories
  anti_roll_bar?: string;
  strut_brace?: string;
  created_at: string;
  updated_at: string;
}

export interface CarBrake {
  id: string;
  car_id: string;
  position: 'front' | 'rear';
  caliper?: string;
  disc_size?: string;
  disc_type?: string;
  pads?: string;
  created_at: string;
  updated_at: string;
}

// Exterior Components
export interface CarPaintFinish {
  id: string;
  car_id: string;
  paint_color?: string;
  paint_type?: string;
  paint_finish?: string;
  wrap_brand?: string;
  wrap_color?: string;
  created_at: string;
  updated_at: string;
}

export interface CarLightingModifications {
  id: string;
  car_id: string;
  headlights?: string;
  taillights?: string;
  fog_lights?: string;
  underglow?: string;
  interior_lighting?: string;
  created_at: string;
  updated_at: string;
}

export interface CarBodykitModifications {
  id: string;
  car_id: string;
  front_bumper?: string;
  front_lip?: string;
  rear_bumper?: string;
  rear_lip?: string;
  side_skirts?: string;
  rear_spoiler?: string;
  diffuser?: string;
  fender_flares?: string;
  hood?: string;
  created_at: string;
  updated_at: string;
}

// Interior Components
export interface CarSeats {
  id: string;
  car_id: string;
  front_seats?: string;
  rear_seats?: string;
  created_at: string;
  updated_at: string;
}

export interface CarSteeringWheel {
  id: string;
  car_id: string;
  steering_wheel?: string;
  created_at: string;
  updated_at: string;
}

export interface CarAudioSystem {
  id: string;
  car_id: string;
  head_unit?: string;
  speakers?: string;
  subwoofer?: string;
  amplifier?: string;
  created_at: string;
  updated_at: string;
}

export interface CarGauges {
  id: string;
  car_id: string;
  gauge_type: string; // 'boost', 'oil_pressure', 'oil_temp', 'water_temp', 'egt', 'afr', etc.
  brand?: string;
  model?: string;
  size?: string; // '52mm', '60mm', etc.
  position?: string; // 'dash', 'pillar', 'center_console', etc.
  created_at: string;
  updated_at: string;
}

// Main Car interface with all related data
export interface Car {
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
  total_likes: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  
  // Engine-related components
  engine?: CarEngine;
  turbo_system?: CarTurboSystem;
  exhaust_system?: CarExhaustSystem;
  engine_management?: CarEngineManagement;
  internal_components?: CarInternalComponents;
  fuel_system?: CarFuelSystem;
  
  // Chassis components
  wheels?: CarWheel[];
  suspension?: CarSuspension[];
  brakes?: CarBrake[];
  
  // Exterior components
  paint_finish?: CarPaintFinish;
  lighting_modifications?: CarLightingModifications;
  bodykit_modifications?: CarBodykitModifications;
  
  // Interior components
  seats?: CarSeats;
  steering_wheel?: CarSteeringWheel;
  audio_system?: CarAudioSystem;
  gauges?: CarGauges[];
}

export interface CarLike {
  car_id: string;
  user_id: string;
  created_at: string;
}
