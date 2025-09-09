import { getUser } from "@/lib/auth";
import {
  updateCarWithComponents,
  getCarById,
  deleteCar,
} from "@/lib/server/cars";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { EditCarForm } from "@/components/garage";
import { uploadCarImages } from "@/lib/server/image-upload";

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

  // Handle JSON structured fields
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
  const car = await getCarById(carId);

  if (!car || car.owner_id !== user.id) {
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
  const [user, car] = await Promise.all([getUser(), getCarById(id)]);

  if (!car) {
    notFound();
  }

  // Check if user owns this car
  if (car.owner_id !== user.id) {
    redirect("/garage");
  }

  const updateAction = updateCarAction.bind(null, id);
  const deleteAction = deleteCarAction.bind(null, id);

  return (
    <EditCarForm
      car={car}
      action={updateAction}
      onDelete={deleteAction}
      uploadAction={uploadCarImagesServerAction}
    />
  );
}
