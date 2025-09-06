// Main Car interface with flattened database structure
export interface Car {
  // Basic car information
  id: string;
  owner_id: string;
  brand: string;
  model: string;
  year: number;
  images?: string[];
  total_likes: number;
  is_liked?: boolean; // Whether current user has liked this car
  created_at: string;
  updated_at: string;

  // Engine specifications
  engine_code?: string;
  displacement?: string;
  aspiration?: string;
  power_hp?: number;
  torque_nm?: number;

  // Engine management
  ecu?: string;
  tuned_by?: string;

  // Internal engine components
  pistons?: string;
  connecting_rods?: string;
  valves?: string;
  valve_springs?: string;
  camshafts?: string;

  // Exhaust & intake
  header?: string;
  exhaust?: string;
  intake?: string;

  // Turbo system
  turbo?: string;
  intercooler?: string;

  // Fuel system
  fuel_injectors?: string;
  fuel_pump?: string;
  fuel_rail?: string;

  // Audio system
  head_unit?: string;
  speakers?: string;
  subwoofer?: string;
  amplifier?: string;

  // Exterior modifications
  front_bumper?: string;
  front_lip?: string;
  rear_bumper?: string;
  rear_lip?: string;
  side_skirts?: string;
  rear_spoiler?: string;
  diffuser?: string;
  fender_flares?: string;
  hood?: string;

  // Paint & finish
  paint_color?: string;
  paint_finish?: string;
  wrap_brand?: string;
  wrap_color?: string;

  // Interior
  front_seats?: string;
  rear_seats?: string;
  steering_wheel?: string;

  // Lighting
  headlights?: string;
  taillights?: string;
  fog_lights?: string;
  underglow?: string;
  interior_lighting?: string;

  // JSON structured fields
  brakes?: {
    front?: {
      caliper?: string;
      pads?: string;
      disc_size?: string;
      disc_type?: string;
    };
    rear?: {
      caliper?: string;
      pads?: string;
      disc_size?: string;
      disc_type?: string;
    };
  };

  suspension?: {
    front?: {
      suspension?: string;
      spring_rate?: string;
      strut_brace?: string;
      anti_roll_bar?: string;
      camber_degrees?: number;
      caster_degrees?: string;
      toe_degrees?: string;
    };
    rear?: {
      suspension?: string;
      spring_rate?: string;
      strut_brace?: string;
      anti_roll_bar?: string;
      camber_degrees?: number;
      caster_degrees?: string;
      toe_degrees?: string;
    };
  };

  wheels?: {
    front?: {
      wheel?: string;
      wheel_size?: string;
      wheel_offset?: string;
      tyre?: string;
      tyre_size?: string;
    };
    rear?: {
      wheel?: string;
      wheel_size?: string;
      wheel_offset?: string;
      tyre?: string;
      tyre_size?: string;
    };
  };

  gauges?: Array<{
    id?: string;
    gauge_type?: string;
    brand?: string;
  }>;

  // Owner information (populated via join)
  owner?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

// Legacy compatibility interfaces - these provide backwards compatibility for display components
export interface CarEngine {
  engine_code?: string;
  displacement?: string;
  aspiration?: string;
  power_hp?: number;
  torque_nm?: number;
}

export interface CarTurboSystem {
  turbo?: string;
  intercooler?: string;
}

export interface CarExhaustSystem {
  intake?: string;
  header?: string;
  exhaust?: string;
}

export interface CarEngineManagement {
  ecu?: string;
  tuned_by?: string;
}

export interface CarInternalComponents {
  pistons?: string;
  connecting_rods?: string;
  valves?: string;
  camshafts?: string;
  valve_springs?: string;
}

export interface CarFuelSystem {
  fuel_injectors?: string;
  fuel_pump?: string;
  fuel_rail?: string;
}

export interface CarPaintFinish {
  paint_color?: string;
  paint_finish?: string;
  wrap_brand?: string;
  wrap_color?: string;
}

export interface CarLightingModifications {
  headlights?: string;
  taillights?: string;
  fog_lights?: string;
  underglow?: string;
  interior_lighting?: string;
}

export interface CarBodykitModifications {
  front_bumper?: string;
  front_lip?: string;
  rear_bumper?: string;
  rear_lip?: string;
  side_skirts?: string;
  rear_spoiler?: string;
  diffuser?: string;
  fender_flares?: string;
  hood?: string;
}

export interface CarSeats {
  front_seats?: string;
  rear_seats?: string;
}

export interface CarSteeringWheel {
  steering_wheel?: string;
}

export interface CarAudioSystem {
  head_unit?: string;
  speakers?: string;
  subwoofer?: string;
  amplifier?: string;
}

// For backwards compatibility with display components
export interface CarWheel {
  id?: string;
  position: 'front' | 'rear';
  wheel?: string;
  wheel_size?: string;
  wheel_offset?: string;
  tyre?: string;
  tyre_size?: string;
}

export interface CarSuspension {
  id?: string;
  position?: 'front' | 'rear';
  suspension_type?: string;
  suspension?: string;
  spring_rate?: string;
  strut_brace?: string;
  anti_roll_bar?: string;
  camber_degrees?: number;
  caster_degrees?: string;
  toe_degrees?: string;
}

export interface CarBrake {
  id?: string;
  position: 'front' | 'rear';
  caliper?: string;
  pads?: string;
  disc_size?: string;
  disc_type?: string;
}

export interface CarGauge {
  id?: string;
  gauge_type?: string;
  brand?: string;
}

// Backwards compatibility type alias
export type CarGauges = CarGauge;

export interface CarLike {
  car_id: string;
  user_id: string;
  created_at: string;
}

export interface CarLike {
  car_id: string;
  user_id: string;
  created_at: string;
}
