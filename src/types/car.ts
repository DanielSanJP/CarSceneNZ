export interface WheelSpecs {
  size?: string;
  offset?: string;
  brand?: string;
  [key: string]: unknown;
}

export interface TireSpecs {
  size?: string;
  brand?: string;
  type?: string;
  [key: string]: unknown;
}

export interface EngineSpecs {
  type?: string;
  displacement?: string;
  horsepower?: number;
  torque?: number;
  modifications?: string[];
  [key: string]: unknown;
}

export interface SuspensionSpecs {
  type?: string;
  brand?: string;
  modifications?: string[];
  [key: string]: unknown;
}

export interface BrakeSpecs {
  type?: string;
  brand?: string;
  modifications?: string[];
  [key: string]: unknown;
}

export interface ExteriorSpecs {
  color?: string;
  modifications?: string[];
  [key: string]: unknown;
}

export interface InteriorSpecs {
  seats?: string;
  modifications?: string[];
  [key: string]: unknown;
}

export interface PerformanceMods {
  intake?: string;
  exhaust?: string;
  turbo?: boolean;
  other?: string[];
  [key: string]: unknown;
}

export interface Car {
  id: string;
  owner_id: string; // References User.id
  brand: string;
  model: string;
  year: number;
  suspension_type?: string;
  wheel_specs?: WheelSpecs;
  tire_specs?: TireSpecs;
  engine?: EngineSpecs;
  suspension?: SuspensionSpecs;
  brakes?: BrakeSpecs;
  exterior?: ExteriorSpecs;
  interior?: InteriorSpecs;
  performance_mods?: PerformanceMods;
  images?: string[]; // Array
  total_likes: number;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export interface CarLike {
  car_id: string;
  user_id: string; // References User.id
  created_at: string;
}
