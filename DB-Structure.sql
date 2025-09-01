-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
CREATE TABLE public.car_brake_accessories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    component character varying NOT NULL,
    brand character varying,
    model character varying,
    description character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_brake_accessories_pkey PRIMARY KEY (id),
    CONSTRAINT car_brake_accessories_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_brakes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    position character varying NOT NULL CHECK (
        "position"::text = ANY (
            ARRAY ['front'::character varying, 'rear'::character varying]::text []
        )
    ),
    caliper character varying,
    disc_size character varying,
    disc_type character varying,
    pads character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_brakes_pkey PRIMARY KEY (id),
    CONSTRAINT car_brakes_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_engine_modifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    component character varying NOT NULL,
    subcomponent character varying,
    brand character varying,
    model character varying,
    description text,
    is_custom boolean DEFAULT false,
    tuned_by character varying,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_engine_modifications_pkey PRIMARY KEY (id),
    CONSTRAINT car_engine_modifications_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_engines (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL UNIQUE,
    engine_code character varying,
    displacement character varying,
    aspiration character varying,
    power_hp integer,
    torque_nm integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_engines_pkey PRIMARY KEY (id),
    CONSTRAINT car_engines_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_exterior (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    category character varying NOT NULL,
    component character varying,
    brand character varying,
    model character varying,
    color character varying,
    type character varying,
    finish character varying,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_exterior_pkey PRIMARY KEY (id),
    CONSTRAINT car_exterior_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_interior (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    category character varying NOT NULL,
    position character varying,
    brand character varying,
    model character varying,
    size character varying,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_interior_pkey PRIMARY KEY (id),
    CONSTRAINT car_interior_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_likes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_likes_pkey PRIMARY KEY (id),
    CONSTRAINT car_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT car_likes_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_performance_mods (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    category character varying NOT NULL,
    modification character varying NOT NULL,
    brand character varying,
    model character varying,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_performance_mods_pkey PRIMARY KEY (id),
    CONSTRAINT car_performance_mods_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_suspension (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    position character varying CHECK (
        "position"::text = ANY (
            ARRAY ['front'::character varying, 'rear'::character varying]::text []
        )
    ),
    suspension_type character varying,
    brand character varying,
    model character varying,
    spring_rate character varying,
    camber_degrees numeric,
    toe_degrees character varying,
    caster_degrees character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_suspension_pkey PRIMARY KEY (id),
    CONSTRAINT car_suspension_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_suspension_accessories (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    accessory_type character varying NOT NULL,
    position character varying,
    brand character varying,
    model character varying,
    size character varying,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_suspension_accessories_pkey PRIMARY KEY (id),
    CONSTRAINT car_suspension_accessories_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.car_wheels (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    car_id uuid NOT NULL,
    position character varying NOT NULL CHECK (
        "position"::text = ANY (
            ARRAY ['front'::character varying, 'rear'::character varying]::text []
        )
    ),
    wheel_brand character varying,
    wheel_size character varying,
    wheel_offset character varying,
    tire_size character varying,
    camber_degrees numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT car_wheels_pkey PRIMARY KEY (id),
    CONSTRAINT car_wheels_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);
CREATE TABLE public.cars (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL,
    brand character varying NOT NULL,
    model character varying NOT NULL,
    year integer NOT NULL,
    suspension_type character varying,
    wheel_specs jsonb,
    tire_specs jsonb,
    engine jsonb,
    suspension jsonb,
    brakes jsonb,
    exterior jsonb,
    interior jsonb,
    performance_mods jsonb,
    images ARRAY,
    total_likes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cars_pkey PRIMARY KEY (id),
    CONSTRAINT cars_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.club_members (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    club_id character varying NOT NULL,
    user_id uuid NOT NULL,
    role character varying DEFAULT 'member'::character varying CHECK (
        role::text = ANY (
            ARRAY ['leader'::character varying, 'co-leader'::character varying, 'member'::character varying]::text []
        )
    ),
    joined_at timestamp with time zone DEFAULT now(),
    CONSTRAINT club_members_pkey PRIMARY KEY (id),
    CONSTRAINT club_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
    CONSTRAINT club_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.clubs (
    id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    banner_image_url text,
    club_type character varying CHECK (
        club_type::text = ANY (
            ARRAY ['open'::character varying, 'invite'::character varying, 'closed'::character varying]::text []
        )
    ),
    location character varying,
    leader_id uuid NOT NULL,
    total_likes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT clubs_pkey PRIMARY KEY (id),
    CONSTRAINT clubs_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id)
);
CREATE TABLE public.event_attendees (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status character varying DEFAULT 'interested'::character varying CHECK (
        status::text = ANY (
            ARRAY ['interested'::character varying, 'going'::character varying, 'approved'::character varying]::text []
        )
    ),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT event_attendees_pkey PRIMARY KEY (id),
    CONSTRAINT event_attendees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
    CONSTRAINT event_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    host_id uuid NOT NULL,
    title character varying NOT NULL,
    description text,
    poster_image_url text,
    daily_schedule jsonb NOT NULL,
    location character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT events_pkey PRIMARY KEY (id),
    CONSTRAINT events_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.users(id)
);
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    subject character varying,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id),
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_follows (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_follows_pkey PRIMARY KEY (id),
    CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id),
    CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying NOT NULL UNIQUE,
    profile_image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);