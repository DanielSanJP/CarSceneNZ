import { requireAuth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { EditCarForm } from "@/components/garage";
import { uploadCarImages } from "@/lib/utils/image-upload";
import { Car } from "@/types";
import { cleanupOrphanedCarImagesAction } from "@/lib/actions/delete-actions";
import {
  updateCarWithComponentsAction,
  deleteCarAction as deleteCarServerAction,
} from "@/lib/actions/car-actions";
import { createClient } from "@/lib/utils/supabase/server";

// Utility function to clean up image URLs and remove duplicates
function cleanImageArray(images: string[]): string[] {
  const cleanedImages: string[] = [];
  const seenBaseUrls = new Set<string>();

  // Process images from newest to oldest (keep the most recent version)
  for (let i = images.length - 1; i >= 0; i--) {
    const imageUrl = images[i];
    if (!imageUrl) continue;

    // Extract base URL without timestamp parameter
    const baseUrl = imageUrl.split("?v=")[0];

    // Only keep the first occurrence (newest) of each base URL
    if (!seenBaseUrls.has(baseUrl)) {
      seenBaseUrls.add(baseUrl);
      cleanedImages.unshift(imageUrl); // Add to beginning to maintain order
    }
  }

  return cleanedImages;
}

interface EditCarPageProps {
  params: Promise<{ id: string }>;
}

async function uploadCarImagesServerAction(
  formData: FormData
): Promise<{ urls: string[]; error: string | null }> {
  "use server";

  try {
    const files = formData.getAll("files") as File[];
    const carId = formData.get("carId") as string;
    const isTemp = formData.get("isTemp") === "true";
    const existingImageCount =
      parseInt(formData.get("existingImageCount") as string) || 0;

    if (!files || files.length === 0 || !carId) {
      return { urls: [], error: "Missing files or car ID" };
    }

    const urls = await uploadCarImages(
      files,
      carId,
      isTemp,
      existingImageCount
    );
    return { urls, error: null };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      urls: [],
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

async function updateCarAction(carId: string, formData: FormData) {
  "use server";

  // Extract basic car info
  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const imagesJson = formData.get("images") as string;

  if (!brand?.trim() || !model?.trim() || !year) {
    throw new Error("Brand, model, and year are required");
  }

  // Parse images
  let images: string[] = [];
  try {
    if (imagesJson) {
      const parsedImages = JSON.parse(imagesJson);
      // Clean up duplicate images (handle corrupted data)
      images = cleanImageArray(parsedImages);
    }
  } catch (error) {
    console.error("Error parsing images:", error);
  }

  // Build the flattened car data object
  const carData: Record<string, string | number | undefined | unknown[]> = {
    brand: brand.trim(),
    model: model.trim(),
    year,
    images,
  };

  // Add all the flattened fields from FormData
  const flattenedFields = [
    "engine_code",
    "displacement",
    "aspiration",
    "power_hp",
    "torque_nm",
    "ecu",
    "tuned_by",
    "pistons",
    "connecting_rods",
    "valves",
    "valve_springs",
    "camshafts",
    "header",
    "exhaust",
    "intake",
    "turbo",
    "supercharger",
    "twin_turbo_setup",
    "intercooler",
    "fuel_injectors",
    "fuel_pump",
    "fuel_rail",
    "head_unit",
    "speakers",
    "subwoofer",
    "amplifier",
    "front_bumper",
    "front_lip",
    "rear_bumper",
    "rear_lip",
    "side_skirts",
    "rear_spoiler",
    "diffuser",
    "fender_flares",
    "hood",
    "paint_color",
    "paint_finish",
    "wrap_brand",
    "wrap_color",
    "front_seats",
    "rear_seats",
    "steering_wheel",
    "headlights",
    "taillights",
    "fog_lights",
    "underglow",
    "interior_lighting",
  ];

  flattenedFields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      if (field === "power_hp" || field === "torque_nm") {
        carData[field] = value ? parseInt(value as string) : undefined;
      } else {
        carData[field] = value as string;
      }
    }
  });

  // Handle JSON structured fields - use JSONB format directly
  const jsonFields = ["brakes", "suspension", "wheels", "gauges"];
  jsonFields.forEach((field) => {
    const jsonValue = formData.get(field) as string;
    if (jsonValue) {
      try {
        carData[field] = JSON.parse(jsonValue);
      } catch (error) {
        console.error(`Error parsing ${field}:`, error);
      }
    }
  });

  console.log(`🛠️ Server Action: Final carData being sent to database:`, {
    supercharger: carData.supercharger,
    twin_turbo_setup: carData.twin_turbo_setup,
    turbo: carData.turbo,
    intercooler: carData.intercooler,
  });

  const result = await updateCarWithComponentsAction(carId, carData);

  if (!result) {
    throw new Error("Failed to update car");
  }

  // Cleanup any orphaned images that may have been replaced
  try {
    const currentImages = result.images || [];
    await cleanupOrphanedCarImagesAction(carId, currentImages);
    console.log(`🧹 Car Update: Cleanup completed for car ${carId}`);
  } catch (cleanupError) {
    console.error("Error during image cleanup:", cleanupError);
    // Don't fail the update if cleanup fails
  }

  // Revalidate all garage-related paths
  revalidatePath("/garage"); // Main garage page
  revalidatePath(`/garage/${carId}`); // Car detail page
  revalidatePath("/garage/my-garage"); // User's garage
  revalidatePath("/"); // Home page (shows recent cars)
  revalidatePath("/search"); // Search page
  revalidatePath("/leaderboards"); // Leaderboards page
  revalidatePath(`/profile/${result.owner_id}`); // Car owner's profile page

  // Revalidate cache tags for comprehensive data consistency
  revalidateTag("garage"); // All garage data
  revalidateTag("cars"); // All car data
  revalidateTag(`car-${carId}`); // Specific car data
  revalidateTag(`user-${result.owner_id}-cars`); // User-specific car data
  revalidateTag("home-data"); // Home page data
  revalidateTag("search-data"); // Search data
  revalidateTag("leaderboards"); // Leaderboard data
  revalidateTag("users"); // User profiles data

  redirect(`/garage/${carId}`);
}

async function deleteCarAction(carId: string) {
  "use server";

  const authUser = await requireAuth();
  const supabase = await createClient();

  // Get car data for permission check using direct query
  const { data: carData, error } = await supabase
    .from("cars")
    .select("id, owner_id")
    .eq("id", carId)
    .single();

  if (error || !carData) {
    throw new Error("Car not found");
  }

  if (carData.owner_id !== authUser.id) {
    throw new Error("Unauthorized");
  }

  const success = await deleteCarServerAction(carId);

  if (!success) {
    throw new Error("Failed to delete car");
  }

  console.log(
    `🔄 Car Delete: Starting comprehensive cache revalidation for deleted car ${carId}`
  );

  // Revalidate all garage-related paths
  revalidatePath("/garage"); // Main garage page
  revalidatePath("/garage/my-garage"); // User's garage
  revalidatePath("/"); // Home page (shows recent cars)
  revalidatePath("/search"); // Search page
  revalidatePath("/leaderboards"); // Leaderboards page
  revalidatePath(`/profile/${authUser.id}`); // User's profile page

  // Revalidate cache tags for comprehensive data consistency
  revalidateTag("garage"); // All garage data
  revalidateTag("cars"); // All car data
  revalidateTag(`car-${carId}`); // Specific car data
  revalidateTag(`user-${authUser.id}-cars`); // User-specific car data
  revalidateTag("home-data"); // Home page data
  revalidateTag("search-data"); // Search data
  revalidateTag("leaderboards"); // Leaderboard data
  revalidateTag("users"); // User profiles data

  console.log(
    `✅ Car Delete: Cache revalidation completed for deleted car ${carId}`
  );

  redirect("/garage");
}

export default async function EditCarPage({ params }: EditCarPageProps) {
  const { id } = await params;
  const authUser = await requireAuth();
  const supabase = await createClient();

  // Fetch car data using direct Supabase query
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
    .eq("id", id)
    .single();

  if (carError || !carData) {
    console.error("Failed to fetch car details:", carError);
    notFound();
  }

  // Transform owner data
  const owner = Array.isArray(carData.owner) ? carData.owner[0] : carData.owner;

  // Build carDetailData structure similar to what the API would return
  const carDetailData = {
    car: {
      id: carData.id,
      owner_id: carData.owner_id,
      brand: carData.brand,
      model: carData.model,
      year: carData.year,
      images: carData.images || [],
      total_likes: carData.total_likes || 0,
      created_at: carData.created_at,
      updated_at: carData.updated_at,
      owner: owner,
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
    brakes: carData.brakes,
    suspension: carData.suspension,
    wheels: carData.wheels,
    gauges: carData.gauges,
  };

  // Extract the flattened car data from the nested structure for the edit form
  const car: Car = {
    // Basic car info
    id: carDetailData.car.id,
    owner_id: carDetailData.car.owner_id,
    brand: carDetailData.car.brand,
    model: carDetailData.car.model,
    year: carDetailData.car.year,
    images: carDetailData.car.images,
    total_likes: carDetailData.car.total_likes,
    created_at: carDetailData.car.created_at,
    updated_at: carDetailData.car.updated_at,

    // Flatten engine data
    engine_code: carDetailData.engine?.engine_code,
    displacement: carDetailData.engine?.displacement,
    aspiration: carDetailData.engine?.aspiration,
    power_hp: carDetailData.engine?.power_hp,
    torque_nm: carDetailData.engine?.torque_nm,
    ecu: carDetailData.engine?.ecu,
    tuned_by: carDetailData.engine?.tuned_by,
    pistons: carDetailData.engine?.pistons,
    connecting_rods: carDetailData.engine?.connecting_rods,
    valves: carDetailData.engine?.valves,
    valve_springs: carDetailData.engine?.valve_springs,
    camshafts: carDetailData.engine?.camshafts,
    header: carDetailData.engine?.header,
    exhaust: carDetailData.engine?.exhaust,
    intake: carDetailData.engine?.intake,
    turbo: carDetailData.engine?.turbo,
    intercooler: carDetailData.engine?.intercooler,
    fuel_injectors: carDetailData.engine?.fuel_injectors,
    fuel_pump: carDetailData.engine?.fuel_pump,
    fuel_rail: carDetailData.engine?.fuel_rail,

    // Flatten interior data
    front_seats: carDetailData.interior?.front_seats,
    rear_seats: carDetailData.interior?.rear_seats,
    steering_wheel: carDetailData.interior?.steering_wheel,
    head_unit: carDetailData.interior?.head_unit,
    speakers: carDetailData.interior?.speakers,
    subwoofer: carDetailData.interior?.subwoofer,
    amplifier: carDetailData.interior?.amplifier,

    // Flatten exterior data
    front_bumper: carDetailData.exterior?.front_bumper,
    front_lip: carDetailData.exterior?.front_lip,
    rear_bumper: carDetailData.exterior?.rear_bumper,
    rear_lip: carDetailData.exterior?.rear_lip,
    side_skirts: carDetailData.exterior?.side_skirts,
    rear_spoiler: carDetailData.exterior?.rear_spoiler,
    diffuser: carDetailData.exterior?.diffuser,
    fender_flares: carDetailData.exterior?.fender_flares,
    hood: carDetailData.exterior?.hood,
    paint_color: carDetailData.exterior?.paint_color,
    paint_finish: carDetailData.exterior?.paint_finish,
    wrap_brand: carDetailData.exterior?.wrap_brand,
    wrap_color: carDetailData.exterior?.wrap_color,
    headlights: carDetailData.exterior?.headlights,
    taillights: carDetailData.exterior?.taillights,
    fog_lights: carDetailData.exterior?.fog_lights,
    underglow: carDetailData.exterior?.underglow,
    interior_lighting: carDetailData.exterior?.interior_lighting,

    // JSON structured fields
    brakes: carDetailData.brakes,
    suspension: carDetailData.suspension,
    wheels: carDetailData.wheels,
    gauges: carDetailData.gauges,

    // Owner info (optional for edit form)
    owner: carDetailData.car.owner,
  };

  // Check if user owns this car
  if (car.owner_id !== authUser.id) {
    redirect("/garage");
  }

  const updateAction = updateCarAction.bind(null, id);
  const deleteAction = deleteCarAction.bind(null, id);

  return (
    <EditCarForm
      car={car as Car}
      action={updateAction}
      onDelete={deleteAction}
      uploadAction={uploadCarImagesServerAction}
    />
  );
}
