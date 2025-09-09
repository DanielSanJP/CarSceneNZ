import { getUserOptional } from "@/lib/auth";
import { CarDetailView } from "@/components/garage/display/car-detail-view";

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  // Get user (optional - not required to view cars)
  const user = await getUserOptional();
  const { id } = await params;

  return <CarDetailView carId={id} user={user} />;
}
