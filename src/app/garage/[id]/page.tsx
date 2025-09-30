import { getAuthUser, getUserProfile } from "@/lib/auth";
import { CarDetailView } from "@/components/garage/display/car-detail-view";
import { likeCarAction } from "@/lib/actions";
import type { CarDetailData } from "@/types/car";
import { createClient } from "@/lib/utils/supabase/server";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

// Helper function to get car details using direct Supabase queries
async function getCarDetailData(
  carId: string,
  userId?: string
): Promise<CarDetailData> {
  const startTime = Date.now();

  console.log(
    `🚀 FETCH CACHE: Fetching car ${carId} details via direct queries...`
  );

  const supabase = await createClient();

  try {
    // Get car details with owner information
    const { data: carData, error: carError } = await supabase
      .from("cars")
      .select(
        `
        *,
        owner:users!cars_owner_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `
      )
      .eq("id", carId)
      .single();

    if (carError || !carData) {
      console.error("❌ Error fetching car:", carError);
      if (carError?.code === "PGRST116") {
        throw new Error("Car not found");
      }
      throw carError;
    }

    console.log(
      `🔍 DEBUG: Found car: ${carData.brand} ${carData.model} (${carData.year})`
    );

    // Get like count
    const { count: likeCount } = await supabase
      .from("car_likes")
      .select("*", { count: "exact", head: true })
      .eq("car_id", carId);

    // Get user's like status if userId is provided
    let isLiked = false;
    if (userId) {
      const { data: likeData } = await supabase
        .from("car_likes")
        .select("id")
        .eq("car_id", carId)
        .eq("user_id", userId)
        .single();

      isLiked = !!likeData;
    }

    // Transform owner data
    const owner = Array.isArray(carData.owner)
      ? carData.owner[0]
      : carData.owner;

    if (!owner) {
      throw new Error("Car owner not found");
    }

    // Return nested structure that matches the CarDetailData interface
    const carDetailData = {
      car: {
        id: carData.id,
        owner_id: carData.owner_id,
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        images: carData.images || [],
        total_likes: likeCount || 0,
        is_liked: isLiked,
        created_at: carData.created_at,
        updated_at: carData.updated_at,
        owner: {
          id: owner.id,
          username: owner.username,
          display_name: owner.display_name,
          profile_image_url: owner.profile_image_url,
        },
      },
      engine: {
        engine_code: carData.engine_code,
        displacement: carData.displacement,
        aspiration: carData.aspiration,
        power_hp: carData.power_hp,
        torque_nm: carData.torque_nm,
        ecu: carData.ecu,
        tuned_by: carData.tuned_by,
        pistons: carData.pistons,
        connecting_rods: carData.connecting_rods,
        valves: carData.valves,
        valve_springs: carData.valve_springs,
        camshafts: carData.camshafts,
        header: carData.header,
        exhaust: carData.exhaust,
        intake: carData.intake,
        turbo: carData.turbo,
        supercharger: carData.supercharger,
        twin_turbo_setup: carData.twin_turbo_setup,
        intercooler: carData.intercooler,
        fuel_injectors: carData.fuel_injectors,
        fuel_pump: carData.fuel_pump,
        fuel_rail: carData.fuel_rail,
      },
      interior: {
        front_seats: carData.front_seats,
        rear_seats: carData.rear_seats,
        steering_wheel: carData.steering_wheel,
        head_unit: carData.head_unit,
        speakers: carData.speakers,
        subwoofer: carData.subwoofer,
        amplifier: carData.amplifier,
      },
      exterior: {
        front_bumper: carData.front_bumper,
        front_lip: carData.front_lip,
        rear_bumper: carData.rear_bumper,
        rear_lip: carData.rear_lip,
        side_skirts: carData.side_skirts,
        rear_spoiler: carData.rear_spoiler,
        diffuser: carData.diffuser,
        fender_flares: carData.fender_flares,
        hood: carData.hood,
        paint_color: carData.paint_color,
        paint_finish: carData.paint_finish,
        wrap_brand: carData.wrap_brand,
        wrap_color: carData.wrap_color,
        headlights: carData.headlights,
        taillights: carData.taillights,
        fog_lights: carData.fog_lights,
        underglow: carData.underglow,
        interior_lighting: carData.interior_lighting,
      },
      brakes: carData.brakes || {},
      suspension: carData.suspension || {},
      wheels: carData.wheels || {},
      gauges: Array.isArray(carData.gauges) ? carData.gauges : [],
      meta: {
        generated_at: new Date().toISOString(),
        cache_key: `car-${carId}-${userId || "anonymous"}`,
      },
    };

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Car ${carId} details fetched and processed in ${
        endTime - startTime
      }ms`
    );

    console.log(
      `📊 Final data - Car: ${carDetailData.car.brand} ${carDetailData.car.model}, Liked: ${carDetailData.car.is_liked}, Likes: ${carDetailData.car.total_likes}`
    );

    return carDetailData;
  } catch (error) {
    console.error("❌ Error fetching car details:", error);
    throw error;
  }
}

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CarDetailsPage({ params }: CarDetailPageProps) {
  const { id } = await params;

  try {
    // Get user directly in server component
    const authUser = await getAuthUser();
    const user = authUser ? await getUserProfile(authUser.id) : null;

    // Get car details using our cached API route
    const carDetailData = await getCarDetailData(id, user?.id);

    return (
      <CarDetailView
        user={user}
        carDetailData={carDetailData}
        likeCarAction={likeCarAction}
      />
    );
  } catch (error) {
    console.error("❌ Error loading car on server:", error);

    // Return error state instead of notFound() to see what's happening
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Failed to load car details
          </h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the car information.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
}
