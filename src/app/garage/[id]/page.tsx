import { getUserOptional } from "@/lib/auth";
import {
  getCarByIdWithLikeStatus,
  likeCarAction,
  unlikeCarAction,
} from "@/lib/server/cars";
import { notFound } from "next/navigation";
import { CarDetailView } from "@/components/garage/display/car-detail-view";

interface CarDetailPageProps {
  params: { id: string };
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  // Get user (optional - not required to view cars)
  const user = await getUserOptional();
  const { id } = await params;

  // Fetch car data with like status using optimized cached function
  const carWithLikeStatus = await getCarByIdWithLikeStatus(id, user?.id);

  if (!carWithLikeStatus) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <CarDetailView
            car={carWithLikeStatus}
            user={user}
            onLike={likeCarAction}
            onUnlike={unlikeCarAction}
          />
        </div>
      </div>
    </div>
  );
}
