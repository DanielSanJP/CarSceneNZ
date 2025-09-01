// New normalized interfaces for car components
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

export interface CarEngineModification {
  id: string;
  car_id: string;
  component: string; // 'turbo', 'intercooler', 'exhaust', 'intake', 'ecu', 'internals', 'fuel_system'
  subcomponent?: string; // 'header', 'catback', 'pistons', 'rods', etc.
  brand?: string;
  model?: string;
  description?: string;
  is_custom: boolean;
  tuned_by?: string; // for ECU
  created_at: string;
}

export interface CarWheel {
  id: string;
  car_id: string;
  position: 'front' | 'rear';
  wheel_brand?: string;
  wheel_size?: string;
  wheel_offset?: string;
  tire_size?: string;
  camber_degrees?: number;
  created_at: string;
  updated_at: string;
}

export interface CarSuspension {
  id: string;
  car_id: string;
  position?: 'front' | 'rear'; // nullable for general suspension_type
  suspension_type?: string; // 'coilovers', 'springs', 'air' etc.
  brand?: string;
  model?: string;
  spring_rate?: string;
  camber_degrees?: number;
  toe_degrees?: string;
  caster_degrees?: string;
  created_at: string;
  updated_at: string;
}

export interface CarSuspensionAccessory {
  id: string;
  car_id: string;
  accessory_type: string; // 'anti_roll_bar', 'strut_brace'
  position?: string; // 'front', 'rear', or null for general
  brand?: string;
  model?: string;
  size?: string;
  description?: string;
  created_at: string;
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

export interface CarBrakeAccessory {
  id: string;
  car_id: string;
  component: string; // 'brake_lines', 'master_cylinder'
  brand?: string;
  model?: string;
  description?: string;
  created_at: string;
}

export interface CarExterior {
  id: string;
  car_id: string;
  category: string; // 'body_kit', 'paint', 'lighting'
  component?: string; // 'front_bumper', 'rear_bumper', 'headlights', etc.
  brand?: string;
  model?: string;
  color?: string;
  type?: string;
  finish?: string;
  description?: string;
  created_at: string;
}

export interface CarInterior {
  id: string;
  car_id: string;
  category: string; // 'seats', 'audio', 'steering_wheel', 'gauges', 'roll_cage'
  position?: string; // 'front', 'rear', or null for general items
  brand?: string;
  model?: string;
  size?: string;
  description?: string;
  created_at: string;
}

export interface CarPerformanceMod {
  id: string;
  car_id: string;
  category: string; // 'weight_reduction', 'aero', 'chassis', 'cooling'
  modification: string;
  brand?: string;
  model?: string;
  description?: string;
  created_at: string;
}

// Updated main Car interface with related data
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
  // Related normalized data (populated via joins)
  engine?: CarEngine;
  engine_modifications?: CarEngineModification[];
  wheels?: CarWheel[];
  suspension?: CarSuspension[];
  suspension_accessories?: CarSuspensionAccessory[];
  brakes?: CarBrake[];
  brake_accessories?: CarBrakeAccessory[];
  exterior?: CarExterior[];
  interior?: CarInterior[];
  performance_mods?: CarPerformanceMod[];
}

export interface CarLike {
  car_id: string;
  user_id: string; // References User.id
  created_at: string;
}
