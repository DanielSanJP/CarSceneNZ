import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { EditCarForm } from "@/components/garage";
import { uploadCarImages } from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { getBaseUrl } from "@/lib/utils";
import { Car } from "@/types";

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

  const authUser = await requireAuth();

  // Use our simplified API route to get car data for permission check
  const response = await fetch(
    `${getBaseUrl()}/api/garage/${carId}?userId=${authUser.id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Car not found");
  }

  const carData = await response.json();

  if (!carData || !carData.car || carData.car.owner_id !== authUser.id) {
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
  const authUser = await requireAuth();

  // Use our simplified API route instead of RPC
  const response = await fetch(
    `${getBaseUrl()}/api/garage/${id}?userId=${authUser.id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch car details:", response.status);
    notFound();
  }

  const carDetailData = await response.json();

  if (!carDetailData || !carDetailData.car) {
    notFound();
  }

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
    is_liked: carDetailData.car.is_liked,
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
