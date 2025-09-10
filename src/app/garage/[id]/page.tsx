import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { CarDetailView } from "@/components/garage/display/car-detail-view";
import type { CarDetailData } from "@/types/car";

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  // Get user (optional - not required to view cars)
  const user = await getUserOptional();
  const { id } = await params;

  // Fetch initial car data directly in server component
  const supabase = await createClient();
  const { data: initialData } = await supabase.rpc("get_car_detail_optimized", {
    car_id_param: id,
    user_id_param: user?.id || null,
  });

  // If car not found, this will be handled by the client component
  const carDetailData: CarDetailData | null = initialData || null;

  return <CarDetailView carId={id} user={user} initialData={carDetailData} />;
}
