import { getCurrentUser } from "@/lib/server/auth";
import { getCarById } from "@/lib/server/cars";
import { notFound } from "next/navigation";
import { CarDetailView } from "@/components/garage/display/car-detail-view";

interface CarDetailPageProps {
  params: { id: string };
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const [user, car] = await Promise.all([
    getCurrentUser(),
    getCarById(params.id),
  ]);

  if (!car) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <CarDetailView car={car} user={user} />
        </div>
      </div>
    </div>
  );
}
