import { getUser } from "@/lib/auth";
import { getCarById } from "@/lib/server/cars";
import { updateCarWithComponents } from "@/lib/server/car-actions";
import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { EditCarForm } from "@/components/garage";

interface EditCarPageProps {
  params: { id: string };
}

async function updateCarAction(carId: string, formData: FormData) {
  "use server";

  // Extract basic car info
  const brand = formData.get("brand") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const imagesJson = formData.get("images") as string;

  // Extract component data (these will be JSON stringified from the form)
  const engineJson = formData.get("engine") as string;
  const chassisJson = formData.get("chassis") as string;
  const exteriorJson = formData.get("exterior") as string;
  const interiorJson = formData.get("interior") as string;

  if (!brand?.trim() || !model?.trim() || !year) {
    throw new Error("Brand, model, and year are required");
  }

  // Parse JSON data
  let images = [];
  let engine, chassis, exterior, interior;

  try {
    if (imagesJson) images = JSON.parse(imagesJson);
    if (engineJson) engine = JSON.parse(engineJson);
    if (chassisJson) chassis = JSON.parse(chassisJson);
    if (exteriorJson) exterior = JSON.parse(exteriorJson);
    if (interiorJson) interior = JSON.parse(interiorJson);
  } catch (error) {
    console.error("Error parsing component data:", error);
  }

  const carData = {
    brand: brand.trim(),
    model: model.trim(),
    year,
    images,
    engine,
    chassis,
    exterior,
    interior,
  };

  const result = await updateCarWithComponents(carId, carData);

  if (!result) {
    throw new Error("Failed to update car");
  }

  revalidatePath("/garage");
  revalidatePath(`/garage/${carId}`);
  redirect(`/garage/${carId}`);
}

export default async function EditCarPage({ params }: EditCarPageProps) {
  const [user, car] = await Promise.all([getUser(), getCarById(params.id)]);

  if (!car) {
    notFound();
  }

  // Check if user owns this car
  if (car.owner_id !== user.id) {
    redirect("/garage");
  }

  const updateAction = updateCarAction.bind(null, params.id);

  return <EditCarForm car={car} action={updateAction} />;
}
