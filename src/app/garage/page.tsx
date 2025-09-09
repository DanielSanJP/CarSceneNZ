import { GarageGallery } from "@/components/garage/display/garage-gallery";

interface GaragePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function GaragePage({ searchParams }: GaragePageProps) {
  // Await searchParams before accessing properties (Next.js 15 requirement)
  const resolvedSearchParams = await searchParams;

  // Get page from search params, default to 1
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 12; // Show 12 cars per page

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <GarageGallery page={page} limit={limit} />
        </div>
      </div>
    </div>
  );
}
