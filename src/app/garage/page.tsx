import { getUserOptional } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import { GarageGallery } from "@/components/garage/display/garage-gallery";
import type { GarageData } from "@/types/car";

interface GaragePageProps {
  searchParams: Promise<{ page?: string }>;
}

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

export default async function GaragePage({ searchParams }: GaragePageProps) {
  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get page from search params, default to 1
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 12; // Show 12 cars per page

  // Get user (optional - not required to view garage)
  const user = await getUserOptional();

  // Fetch initial garage data directly in server component
  const supabase = await createClient();
  const { data: initialData } = await supabase.rpc(
    "get_garage_gallery_optimized",
    {
      page_num: page,
      page_limit: limit,
      user_id_param: user?.id || null,
    }
  );

  // Transform the data to match our GarageData interface
  const garageData: GarageData | null = initialData
    ? {
        cars: initialData.cars,
        currentUser: user
          ? {
              id: user.id,
              username: user.username,
              display_name: user.display_name,
              profile_image_url: user.profile_image_url,
            }
          : null,
        pagination: initialData.pagination,
        meta: initialData.meta,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <GarageGallery page={page} limit={limit} initialData={garageData} />
        </div>
      </div>
    </div>
  );
}
