import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreateCarForm } from "@/components/garage";
import { createCarWithComponents } from "@/lib/server/car-actions";

async function createCarAction(formData: FormData) {
  "use server";

  const user = await getUser();

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
    owner_id: user.id,
    brand: brand.trim(),
    model: model.trim(),
    year,
    images,
    engine,
    chassis,
    exterior,
    interior,
  };

  const result = await createCarWithComponents(carData);

  if (!result) {
    throw new Error("Failed to create car");
  }

  revalidatePath("/garage");
  redirect(`/garage/${result.id}`);
}

export default async function CreateCarPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CreateCarForm action={createCarAction} />
        </div>
      </div>
    </div>
  );
}
