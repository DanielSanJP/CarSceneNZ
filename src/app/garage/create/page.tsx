import { requireAuth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CreateCarForm } from "@/components/garage";
import {
  moveFromTemp,
  deleteResourceImages,
  uploadCarImages,
} from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { cleanupOrphanedCarImagesAction } from "@/lib/actions/delete-actions";
import { createCarWithComponentsAction } from "@/lib/actions/car-actions";

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

async function createCarAction(formData: FormData) {
  "use server";

  const authUser = await requireAuth();

  // Extract basic car info
  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const imagesJson = formData.get("images") as string;
  const tempCarId = formData.get("tempCarId") as string;

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
  const carData = {
    owner_id: authUser.id,
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

  const additionalData: Record<string, unknown> = {};

  flattenedFields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null && value !== "") {
      if (field === "power_hp" || field === "torque_nm") {
        additionalData[field] = value ? parseInt(value as string) : undefined;
      } else {
        additionalData[field] = value as string;
      }
    }
  });

  // Handle JSON structured fields
  const jsonFields = ["brakes", "suspension", "wheels", "gauges"];
  jsonFields.forEach((field) => {
    const jsonValue = formData.get(field) as string;
    if (jsonValue) {
      try {
        additionalData[field] = JSON.parse(jsonValue);
      } catch (error) {
        console.error(`Error parsing ${field}:`, error);
      }
    }
  });

  try {
    // Create the car record
    const result = await createCarWithComponentsAction({
      ...carData,
      ...additionalData,
    } as Parameters<typeof createCarWithComponentsAction>[0]);

    if (!result) {
      throw new Error("Failed to create car");
    }

    // If we have temp images, move them to the final car folder
    if (tempCarId && images.length > 0) {
      try {
        const newImageUrls = await moveFromTemp(tempCarId, result.id, "cars");
        if (newImageUrls.length > 0) {
          // Update the car record with the new image URLs
          console.log("Images moved successfully:", newImageUrls);

          // Update the database with the new image URLs
          const supabase = await createClient();
          const { error: updateError } = await supabase
            .from("cars")
            .update({ images: newImageUrls })
            .eq("id", result.id);

          if (updateError) {
            console.error(
              "Error updating car with new image URLs:",
              updateError
            );
          } else {
            // After successful move and update, cleanup any remaining temp files
            try {
              await cleanupOrphanedCarImagesAction(result.id, newImageUrls);
            } catch (cleanupError) {
              console.error("Error during temp cleanup:", cleanupError);
              // Don't fail the creation if cleanup fails
            }
          }
        }
      } catch (error) {
        console.error("Error moving temp images:", error);
        // Car was created but images failed to move - log but don't fail
      }
    }

    // Revalidate all garage-related paths
    revalidatePath("/garage"); // Main garage page
    revalidatePath(`/garage/${result.id}`); // Car detail page
    revalidatePath("/garage/my-garage"); // User's garage
    revalidatePath("/"); // Home page (shows recent cars)
    revalidatePath("/search"); // Search page
    revalidatePath("/leaderboards"); // Leaderboards page
    revalidatePath(`/profile/${authUser.id}`); // User's profile page

    // Revalidate cache tags for comprehensive data consistency
    revalidateTag("garage"); // All garage data
    revalidateTag("cars"); // All car data
    revalidateTag(`car-${result.id}`); // Specific car data
    revalidateTag(`user-${authUser.id}-cars`); // User-specific car data
    revalidateTag("home-data"); // Home page data
    revalidateTag("search-data"); // Search data
    revalidateTag("leaderboards"); // Leaderboard data
    revalidateTag("users"); // User profiles data

    redirect(`/garage/${result.id}`);
  } catch (error) {
    // If car creation failed and we have temp images, clean them up
    if (tempCarId) {
      try {
        await deleteResourceImages(tempCarId, "cars");
      } catch (cleanupError) {
        console.error("Error cleaning up temp images:", cleanupError);
      }
    }
    throw error;
  }
}

export default async function CreateCarPage() {
  return (
    <>
      <CreateCarForm
        action={createCarAction}
        uploadAction={uploadCarImagesServerAction}
      />
    </>
  );
}
