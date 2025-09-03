import { getCurrentUser } from "@/lib/server/auth";
import { getCarById } from "@/lib/server/cars";
import { notFound, redirect } from "next/navigation";
import { EditCarForm } from "@/components/garage";

interface EditCarPageProps {
  params: { id: string };
}

export default async function EditCarPage({ params }: EditCarPageProps) {
  const [user, car] = await Promise.all([
    getCurrentUser(),
    getCarById(params.id),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (!car) {
    notFound();
  }

  // Check if user owns this car
  if (car.owner_id !== user.id) {
    redirect("/garage");
  }

  return <EditCarForm car={car} />;
}
