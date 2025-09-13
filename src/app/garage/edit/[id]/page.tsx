import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { EditCarForm } from "@/components/garage";
import { uploadCarImages } from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { Car } from "@/types";

// Transform CarDetailData to Car format using proper JSONB format conversion
function transformCarDetailDataToCarFormat(
  carDetailData: Record<string, unknown>
): Car {
  const {
    car,
    engine,
    exterior,
    interior,
    brakes,
    suspension,
    wheels,
    gauges,
  } = carDetailData;

  // DEBUG: Log the actual structure to understand what we're getting
  console.log("🔍 Edit Page CarDetailData Structure:", {
    brakes: brakes,
    suspension: suspension,
    wheels: wheels,
    gauges: gauges,
    brakesType: Array.isArray(brakes) ? "array" : typeof brakes,
    suspensionType: Array.isArray(suspension) ? "array" : typeof suspension,
    wheelsType: Array.isArray(wheels) ? "array" : typeof wheels,
    gaugesType: Array.isArray(gauges) ? "array" : typeof gauges,
  });

  // Check if the data is already in JSONB format (direct from database)
  // vs array format (from RPC conversion)
  const brakesIsJsonb =
    brakes && !Array.isArray(brakes) && typeof brakes === "object";
  const suspensionIsJsonb =
    suspension && !Array.isArray(suspension) && typeof suspension === "object";
  const wheelsIsJsonb =
    wheels && !Array.isArray(wheels) && typeof wheels === "object";

  let convertedBrakes: Car["brakes"];
  let convertedSuspension: Car["suspension"];
  let convertedWheels: Car["wheels"];

  // Handle brakes - use JSONB directly if available, otherwise convert from array
  if (brakesIsJsonb) {
    console.log("✅ Using brakes JSONB format directly");
    convertedBrakes = brakes as Car["brakes"];
  } else if (Array.isArray(brakes) && brakes.length > 0) {
    console.log("🔄 Converting brakes from array format");
    const brakesArray = brakes as Array<{
      position: string;
      caliper_brand?: string;
      pad_brand?: string;
      rotor_size?: string;
      rotor_model?: string;
    }>;

    convertedBrakes = {
      front: brakesArray.find((b) => b.position === "front")
        ? {
            caliper: brakesArray.find((b) => b.position === "front")
              ?.caliper_brand,
            pads: brakesArray.find((b) => b.position === "front")?.pad_brand,
            disc_size: brakesArray.find((b) => b.position === "front")
              ?.rotor_size,
            disc_type: brakesArray.find((b) => b.position === "front")
              ?.rotor_model,
          }
        : undefined,
      rear: brakesArray.find((b) => b.position === "rear")
        ? {
            caliper: brakesArray.find((b) => b.position === "rear")
              ?.caliper_brand,
            pads: brakesArray.find((b) => b.position === "rear")?.pad_brand,
            disc_size: brakesArray.find((b) => b.position === "rear")
              ?.rotor_size,
            disc_type: brakesArray.find((b) => b.position === "rear")
              ?.rotor_model,
          }
        : undefined,
    };
  } else {
    console.log("❌ No brakes data available");
    convertedBrakes = undefined;
  }

  // Handle suspension - use JSONB directly if available, otherwise convert from array
  if (suspensionIsJsonb) {
    console.log("✅ Using suspension JSONB format directly");
    convertedSuspension = suspension as Car["suspension"];
  } else if (Array.isArray(suspension) && suspension.length > 0) {
    console.log("🔄 Converting suspension from array format");
    const suspensionArray = suspension as Array<{
      position?: string;
      suspension_type?: string;
      brand?: string;
      model?: string;
      spring_rate?: string;
      strut_brace?: string;
      anti_roll_bar?: string;
    }>;

    convertedSuspension = {
      front: suspensionArray.find((s) => s.position === "front")
        ? {
            suspension_type: suspensionArray.find((s) => s.position === "front")
              ?.suspension_type,
            suspension:
              suspensionArray.find((s) => s.position === "front")?.brand ||
              suspensionArray.find((s) => s.position === "front")?.model,
            spring_rate: suspensionArray.find((s) => s.position === "front")
              ?.spring_rate,
            strut_brace: suspensionArray.find((s) => s.position === "front")
              ?.strut_brace,
            anti_roll_bar: suspensionArray.find((s) => s.position === "front")
              ?.anti_roll_bar,
          }
        : undefined,
      rear: suspensionArray.find((s) => s.position === "rear")
        ? {
            suspension_type: suspensionArray.find((s) => s.position === "rear")
              ?.suspension_type,
            suspension:
              suspensionArray.find((s) => s.position === "rear")?.brand ||
              suspensionArray.find((s) => s.position === "rear")?.model,
            spring_rate: suspensionArray.find((s) => s.position === "rear")
              ?.spring_rate,
            strut_brace: suspensionArray.find((s) => s.position === "rear")
              ?.strut_brace,
            anti_roll_bar: suspensionArray.find((s) => s.position === "rear")
              ?.anti_roll_bar,
          }
        : undefined,
    };
  } else {
    console.log("❌ No suspension data available");
    convertedSuspension = undefined;
  }

  // Handle wheels - use JSONB directly if available, otherwise convert from array
  if (wheelsIsJsonb) {
    console.log("✅ Using wheels JSONB format directly");
    convertedWheels = wheels as Car["wheels"];
  } else if (Array.isArray(wheels) && wheels.length > 0) {
    console.log("🔄 Converting wheels from array format");
    const wheelsArray = wheels as Array<{
      position: string;
      brand?: string;
      size?: string;
      offset?: number;
      tire_brand?: string;
      tire_size?: string;
    }>;

    convertedWheels = {
      front: wheelsArray.find((w) => w.position === "front")
        ? {
            wheel: wheelsArray.find((w) => w.position === "front")?.brand,
            wheel_size: wheelsArray.find((w) => w.position === "front")?.size,
            wheel_offset: wheelsArray
              .find((w) => w.position === "front")
              ?.offset?.toString(),
            tyre: wheelsArray.find((w) => w.position === "front")?.tire_brand,
            tyre_size: wheelsArray.find((w) => w.position === "front")
              ?.tire_size,
          }
        : undefined,
      rear: wheelsArray.find((w) => w.position === "rear")
        ? {
            wheel: wheelsArray.find((w) => w.position === "rear")?.brand,
            wheel_size: wheelsArray.find((w) => w.position === "rear")?.size,
            wheel_offset: wheelsArray
              .find((w) => w.position === "rear")
              ?.offset?.toString(),
            tyre: wheelsArray.find((w) => w.position === "rear")?.tire_brand,
            tyre_size: wheelsArray.find((w) => w.position === "rear")
              ?.tire_size,
          }
        : undefined,
    };
  } else {
    console.log("❌ No wheels data available");
    convertedWheels = undefined;
  }

  return {
    ...(car as Record<string, unknown>),
    // Flatten engine data
    ...(engine as Record<string, unknown>),
    // Flatten exterior data
    ...(exterior as Record<string, unknown>),
    // Flatten interior data
    ...(interior as Record<string, unknown>),
    // Use converted JSONB format
    brakes: convertedBrakes,
    suspension: convertedSuspension,
    wheels: convertedWheels,
    gauges: gauges as Car["gauges"], // Gauges are already in correct array format
  } as Car;
}

async function updateCarWithComponents(
  carId: string,
  carData: Record<string, string | number | unknown[] | undefined>
): Promise<Car | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("cars")
      .update({
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        images: carData.images,
        // Add all flattened fields
        engine_code: carData.engine_code || null,
        displacement: carData.displacement || null,
        aspiration: carData.aspiration || null,
        power_hp: carData.power_hp || null,
        torque_nm: carData.torque_nm || null,
        ecu: carData.ecu || null,
        tuned_by: carData.tuned_by || null,
        pistons: carData.pistons || null,
        connecting_rods: carData.connecting_rods || null,
        valves: carData.valves || null,
        valve_springs: carData.valve_springs || null,
        camshafts: carData.camshafts || null,
        header: carData.header || null,
        exhaust: carData.exhaust || null,
        intake: carData.intake || null,
        turbo: carData.turbo || null,
        intercooler: carData.intercooler || null,
        fuel_injectors: carData.fuel_injectors || null,
        fuel_pump: carData.fuel_pump || null,
        fuel_rail: carData.fuel_rail || null,
        head_unit: carData.head_unit || null,
        speakers: carData.speakers || null,
        subwoofer: carData.subwoofer || null,
        amplifier: carData.amplifier || null,
        front_bumper: carData.front_bumper || null,
        front_lip: carData.front_lip || null,
        rear_bumper: carData.rear_bumper || null,
        rear_lip: carData.rear_lip || null,
        side_skirts: carData.side_skirts || null,
        rear_spoiler: carData.rear_spoiler || null,
        diffuser: carData.diffuser || null,
        fender_flares: carData.fender_flares || null,
        hood: carData.hood || null,
        paint_color: carData.paint_color || null,
        paint_finish: carData.paint_finish || null,
        wrap_brand: carData.wrap_brand || null,
        wrap_color: carData.wrap_color || null,
        front_seats: carData.front_seats || null,
        rear_seats: carData.rear_seats || null,
        steering_wheel: carData.steering_wheel || null,
        headlights: carData.headlights || null,
        taillights: carData.taillights || null,
        fog_lights: carData.fog_lights || null,
        underglow: carData.underglow || null,
        interior_lighting: carData.interior_lighting || null,
        // JSON fields
        brakes: carData.brakes || null,
        suspension: carData.suspension || null,
        wheels: carData.wheels || null,
        gauges: carData.gauges || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", carId)
      .select()
      .single();

    if (error || !data) {
      console.error("Error updating car:", error);
      return null;
    }

    return {
      id: data.id,
      owner_id: data.owner_id,
      brand: data.brand,
      model: data.model,
      year: data.year,
      images: data.images || [],
      total_likes: data.total_likes || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      owner: {
        id: data.owner_id,
        username: "",
        display_name: "",
        profile_image_url: undefined,
      },
    };
  } catch (error) {
    console.error("Error updating car:", error);
    return null;
  }
}

async function deleteCar(carId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("cars").delete().eq("id", carId);

    if (error) {
      console.error("Error deleting car:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting car:", error);
    return false;
  }
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

    if (!files || files.length === 0 || !carId) {
      return { urls: [], error: "Missing files or car ID" };
    }

    const urls = await uploadCarImages(files, carId, isTemp);
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
  let images = [];
  try {
    if (imagesJson) images = JSON.parse(imagesJson);
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

  const result = await updateCarWithComponents(carId, carData);

  if (!result) {
    throw new Error("Failed to update car");
  }

  revalidatePath("/garage");
  revalidatePath(`/garage/${carId}`);
  redirect(`/garage/${carId}`);
}

async function deleteCarAction(carId: string) {
  "use server";

  const user = await getUser();

  // Use same RPC to get car data for permission check
  const supabase = await createClient();
  const { data: carDetailData } = await supabase.rpc(
    "get_car_detail_optimized",
    {
      car_id_param: carId,
      user_id_param: user.id,
    }
  );

  if (!carDetailData || carDetailData.car.owner_id !== user.id) {
    throw new Error("Car not found or unauthorized");
  }

  const success = await deleteCar(carId);

  if (!success) {
    throw new Error("Failed to delete car");
  }

  revalidatePath("/garage");
  revalidatePath("/garage/my-garage");
  redirect("/garage");
}

export default async function EditCarPage({ params }: EditCarPageProps) {
  const { id } = await params;
  const user = await getUser();

  // Use same RPC as detail view to get complete car data
  const supabase = await createClient();
  const { data: carDetailData } = await supabase.rpc(
    "get_car_detail_optimized",
    {
      car_id_param: id,
      user_id_param: user.id,
    }
  );

  if (!carDetailData) {
    notFound();
  }

  // Transform the structured data to Car format for the form
  const car = transformCarDetailDataToCarFormat(carDetailData);

  // Check if user owns this car
  if (car.owner_id !== user.id) {
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
