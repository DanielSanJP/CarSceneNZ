import { getAllCars } from "@/lib/server/cars";
import { GarageGallery } from "@/components/garage";
import { getUser } from "@/lib/auth";

export default async function GaragePage() {
  // Get authenticated user with profile (cached per request)
  const user = await getUser();

  // Fetch data on the server
  const cars = await getAllCars();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <GarageGallery cars={cars} user={user} />
        </div>
      </div>
    </div>
  );
}
