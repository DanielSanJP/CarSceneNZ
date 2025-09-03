import { getAllCars } from "@/lib/server/cars";
import { getAllEvents } from "@/lib/server/events";
import { getAllClubs } from "@/lib/server/clubs";
import { getAllUsers } from "@/lib/server/profile";
import { HomePageClient } from "@/components/home-page-client";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Server-side data fetching (like your other pages)
  const [events, cars, clubs, users] = await Promise.all([
    getAllEvents(),
    getAllCars(),
    getAllClubs(),
    getAllUsers(),
  ]);

  return (
    <HomePageClient events={events} cars={cars} clubs={clubs} users={users} />
  );
}
