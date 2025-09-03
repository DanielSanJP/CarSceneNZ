import { getAllCars } from "@/lib/server/cars";
import { GarageGallery } from "@/components/garage";
import { getCurrentUser } from "@/lib/server/auth";

export default async function GaragePage() {
  // Fetch data on the server
  const [cars, user] = await Promise.all([getAllCars(), getCurrentUser()]);

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
