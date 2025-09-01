-- Migration to normalize car data from JSONB to relational tables
-- Run this in your Supabase SQL editor
-- 1. Create new normalized tables
-- Car engines table
CREATE TABLE public.car_engines (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    engine_code varchar,
    displacement varchar,
    aspiration varchar,
    power_hp integer,
    torque_nm integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_engines_pkey PRIMARY KEY (id),
    CONSTRAINT car_engines_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE,
    CONSTRAINT car_engines_car_id_unique UNIQUE (car_id) -- One engine per car
);
-- Engine modifications table
CREATE TABLE public.car_engine_modifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    component varchar NOT NULL,
    -- 'turbo', 'intercooler', 'exhaust', 'intake', 'ecu', 'internals', 'fuel_system'
    subcomponent varchar,
    -- 'header', 'catback', 'pistons', 'rods', etc.
    brand varchar,
    model varchar,
    description text,
    is_custom boolean DEFAULT false,
    tuned_by varchar,
    -- for ECU
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_engine_modifications_pkey PRIMARY KEY (id),
    CONSTRAINT car_engine_modifications_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);
-- Wheels table (includes tires)
CREATE TABLE public.car_wheels (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    position varchar NOT NULL CHECK (position IN ('front', 'rear')),
    wheel_brand varchar,
    wheel_size varchar,
    wheel_offset varchar,
    tire_size varchar,
    camber_degrees decimal(4, 2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_wheels_pkey PRIMARY KEY (id),
    CONSTRAINT car_wheels_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE,
    CONSTRAINT car_wheels_car_position_unique UNIQUE (car_id, position)
);
-- Suspension table (includes suspension_type from cars table)
CREATE TABLE public.car_suspension (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    position varchar CHECK (position IN ('front', 'rear')),
    -- nullable for general suspension_type
    suspension_type varchar,
    -- 'coilovers', 'springs', 'air' etc.
    brand varchar,
    model varchar,
    spring_rate varchar,
    camber_degrees decimal(4, 2),
    toe_degrees varchar,
    caster_degrees varchar,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_suspension_pkey PRIMARY KEY (id),
    CONSTRAINT car_suspension_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);
-- Suspension accessories (anti-roll bars, strut braces)
CREATE TABLE public.car_suspension_accessories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    accessory_type varchar NOT NULL,
    -- 'anti_roll_bar', 'strut_brace'
    position varchar,
    -- 'front', 'rear', or null for general
    brand varchar,
    model varchar,
    size varchar,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_suspension_accessories_pkey PRIMARY KEY (id),
    CONSTRAINT car_suspension_accessories_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);
-- Brakes table
CREATE TABLE public.car_brakes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    position varchar NOT NULL CHECK (position IN ('front', 'rear')),
    caliper varchar,
    disc_size varchar,
    disc_type varchar,
    pads varchar,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_brakes_pkey PRIMARY KEY (id),
    CONSTRAINT car_brakes_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE,
    CONSTRAINT car_brakes_car_position_unique UNIQUE (car_id, position)
);
-- Brake accessories table
CREATE TABLE public.car_brake_accessories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    component varchar NOT NULL,
    -- 'brake_lines', 'master_cylinder'
    brand varchar,
    model varchar,
    description varchar,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_brake_accessories_pkey PRIMARY KEY (id),
    CONSTRAINT car_brake_accessories_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);
-- Exterior modifications table
CREATE TABLE public.car_exterior (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    category varchar NOT NULL,
    -- 'body_kit', 'paint', 'lighting'
    component varchar,
    -- 'front_bumper', 'rear_bumper', 'headlights', etc.
    brand varchar,
    model varchar,
    color varchar,
    type varchar,
    finish varchar,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_exterior_pkey PRIMARY KEY (id),
    CONSTRAINT car_exterior_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);
-- Interior modifications table
CREATE TABLE public.car_interior (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    category varchar NOT NULL,
    -- 'seats', 'audio', 'steering_wheel', 'gauges', 'roll_cage'
    position varchar,
    -- 'front', 'rear', or null for general items
    brand varchar,
    model varchar,
    size varchar,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_interior_pkey PRIMARY KEY (id),
    CONSTRAINT car_interior_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);
-- Performance modifications table
CREATE TABLE public.car_performance_mods (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    category varchar NOT NULL,
    -- 'weight_reduction', 'aero', 'chassis', 'cooling'
    modification varchar NOT NULL,
    brand varchar,
    model varchar,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_performance_mods_pkey PRIMARY KEY (id),
    CONSTRAINT car_performance_mods_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE
);
-- 2. Migrate existing data from JSONB columns to new tables
-- Note: This assumes you have existing data in the cars table
-- Migrate wheel specs
INSERT INTO car_wheels (
        car_id,
        position,
        wheel_brand,
        wheel_size,
        wheel_offset,
        tire_size,
        camber_degrees
    )
SELECT id as car_id,
    'front' as position,
    wheel_specs->'front'->>'brand' as wheel_brand,
    wheel_specs->'front'->>'size' as wheel_size,
    wheel_specs->'front'->>'offset' as wheel_offset,
    tire_specs->>'front' as tire_size,
    CAST(wheel_specs->'front'->>'camber' AS decimal(4, 2)) as camber_degrees
FROM cars
WHERE wheel_specs->'front' IS NOT NULL;
INSERT INTO car_wheels (
        car_id,
        position,
        wheel_brand,
        wheel_size,
        wheel_offset,
        tire_size,
        camber_degrees
    )
SELECT id as car_id,
    'rear' as position,
    wheel_specs->'rear'->>'brand' as wheel_brand,
    wheel_specs->'rear'->>'size' as wheel_size,
    wheel_specs->'rear'->>'offset' as wheel_offset,
    tire_specs->>'rear' as tire_size,
    CAST(wheel_specs->'rear'->>'camber' AS decimal(4, 2)) as camber_degrees
FROM cars
WHERE wheel_specs->'rear' IS NOT NULL;
-- Migrate engine data
INSERT INTO car_engines (
        car_id,
        engine_code,
        displacement,
        aspiration,
        power_hp,
        torque_nm
    )
SELECT id as car_id,
    engine->>'engine_code' as engine_code,
    engine->>'displacement' as displacement,
    engine->>'aspiration' as aspiration,
    CAST(engine->>'power_hp' AS integer) as power_hp,
    CAST(engine->>'torque_nm' AS integer) as torque_nm
FROM cars
WHERE engine IS NOT NULL;
-- Migrate suspension data (including suspension_type from cars table)
INSERT INTO car_suspension (
        car_id,
        position,
        suspension_type,
        brand,
        model,
        spring_rate,
        camber_degrees,
        toe_degrees,
        caster_degrees
    )
SELECT id as car_id,
    'front' as position,
    suspension_type,
    suspension->'front'->>'brand' as brand,
    suspension->'front'->>'model' as model,
    suspension->'front'->>'spring_rate' as spring_rate,
    CAST(suspension->'front'->>'camber' AS decimal(4, 2)) as camber_degrees,
    suspension->'front'->>'toe' as toe_degrees,
    suspension->'front'->>'caster' as caster_degrees
FROM cars
WHERE suspension->'front' IS NOT NULL;
INSERT INTO car_suspension (
        car_id,
        position,
        suspension_type,
        brand,
        model,
        spring_rate,
        camber_degrees,
        toe_degrees,
        caster_degrees
    )
SELECT id as car_id,
    'rear' as position,
    suspension_type,
    suspension->'rear'->>'brand' as brand,
    suspension->'rear'->>'model' as model,
    suspension->'rear'->>'spring_rate' as spring_rate,
    CAST(suspension->'rear'->>'camber' AS decimal(4, 2)) as camber_degrees,
    suspension->'rear'->>'toe' as toe_degrees,
    suspension->'rear'->>'caster' as caster_degrees
FROM cars
WHERE suspension->'rear' IS NOT NULL;
-- Migrate brake data
INSERT INTO car_brakes (
        car_id,
        position,
        caliper,
        disc_size,
        disc_type,
        pads
    )
SELECT id as car_id,
    'front' as position,
    brakes->'front'->>'caliper' as caliper,
    brakes->'front'->>'disc_size' as disc_size,
    brakes->'front'->>'disc_type' as disc_type,
    brakes->'front'->>'pads' as pads
FROM cars
WHERE brakes->'front' IS NOT NULL;
INSERT INTO car_brakes (
        car_id,
        position,
        caliper,
        disc_size,
        disc_type,
        pads
    )
SELECT id as car_id,
    'rear' as position,
    brakes->'rear'->>'caliper' as caliper,
    brakes->'rear'->>'disc_size' as disc_size,
    brakes->'rear'->>'disc_type' as disc_type,
    brakes->'rear'->>'pads' as pads
FROM cars
WHERE brakes->'rear' IS NOT NULL;
-- 3. Remove JSONB columns from cars table (after confirming data migration)
-- UNCOMMENT THESE AFTER VERIFYING YOUR DATA MIGRATION IS SUCCESSFUL:
-- ALTER TABLE cars DROP COLUMN IF EXISTS suspension_type;
-- ALTER TABLE cars DROP COLUMN IF EXISTS wheel_specs;
-- ALTER TABLE cars DROP COLUMN IF EXISTS tire_specs;
-- ALTER TABLE cars DROP COLUMN IF EXISTS engine;
-- ALTER TABLE cars DROP COLUMN IF EXISTS suspension;
-- ALTER TABLE cars DROP COLUMN IF EXISTS brakes;
-- ALTER TABLE cars DROP COLUMN IF EXISTS exterior;
-- ALTER TABLE cars DROP COLUMN IF EXISTS interior;
-- ALTER TABLE cars DROP COLUMN IF EXISTS performance_mods;
-- 4. Enable Row Level Security (RLS) on new tables
ALTER TABLE car_engines ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_engine_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_wheels ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_suspension ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_suspension_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_brakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_brake_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_exterior ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_interior ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_performance_mods ENABLE ROW LEVEL SECURITY;
-- 5. Create RLS policies (public read, owner write)
-- Car engines policies
CREATE POLICY "Public can view car engines" ON car_engines FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own car engines" ON car_engines FOR
INSERT WITH CHECK (
        car_id IN (
            SELECT id
            FROM cars
            WHERE owner_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own car engines" ON car_engines FOR
UPDATE USING (
        car_id IN (
            SELECT id
            FROM cars
            WHERE owner_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete their own car engines" ON car_engines FOR DELETE USING (
    car_id IN (
        SELECT id
        FROM cars
        WHERE owner_id = auth.uid()
    )
);
-- Car engine modifications policies
CREATE POLICY "Public can view car engine modifications" ON car_engine_modifications FOR
SELECT USING (true);
CREATE POLICY "Users can insert their own car engine modifications" ON car_engine_modifications FOR
INSERT WITH CHECK (
        car_id IN (
            SELECT id
            FROM cars
            WHERE owner_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own car engine modifications" ON car_engine_modifications FOR
UPDATE USING (
        car_id IN (
            SELECT id
            FROM cars
            WHERE owner_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete their own car engine modifications" ON car_engine_modifications FOR DELETE USING (
    car_id IN (
        SELECT id
        FROM cars
        WHERE owner_id = auth.uid()
    )
);
-- Repeat similar policies for all other tables
-- (I'll create a function to make this easier)
-- Function to create standard RLS policies for car-related tables
CREATE OR REPLACE FUNCTION create_car_table_policies(table_name text) RETURNS void AS $$ BEGIN EXECUTE format(
        'CREATE POLICY "Public can view %I" ON %I FOR SELECT USING (true)',
        table_name,
        table_name
    );
EXECUTE format(
    'CREATE POLICY "Users can insert their own %I" ON %I FOR INSERT WITH CHECK (car_id IN (SELECT id FROM cars WHERE owner_id = auth.uid()))',
    table_name,
    table_name
);
EXECUTE format(
    'CREATE POLICY "Users can update their own %I" ON %I FOR UPDATE USING (car_id IN (SELECT id FROM cars WHERE owner_id = auth.uid()))',
    table_name,
    table_name
);
EXECUTE format(
    'CREATE POLICY "Users can delete their own %I" ON %I FOR DELETE USING (car_id IN (SELECT id FROM cars WHERE owner_id = auth.uid()))',
    table_name,
    table_name
);
END;
$$ LANGUAGE plpgsql;
-- Apply policies to all car tables
SELECT create_car_table_policies('car_wheels');
SELECT create_car_table_policies('car_suspension');
SELECT create_car_table_policies('car_suspension_accessories');
SELECT create_car_table_policies('car_brakes');
SELECT create_car_table_policies('car_brake_accessories');
SELECT create_car_table_policies('car_exterior');
SELECT create_car_table_policies('car_interior');
SELECT create_car_table_policies('car_performance_mods');
-- Drop the helper function
DROP FUNCTION create_car_table_policies(text);