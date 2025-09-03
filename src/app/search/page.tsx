import { getAllCars } from "@/lib/server/cars";
import { getAllUsers } from "@/lib/server/profile";
import { getAllEvents } from "@/lib/server/events";
import { getAllClubs } from "@/lib/server/clubs";
import { SearchClient } from "@/components/search/search-client";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

export default async function SearchPage() {
  // Fetch all data on the server
  const [carsData, usersData, eventsData, clubsData] = await Promise.all([
    getAllCars(),
    getAllUsers(),
    getAllEvents(),
    getAllClubs(),
  ]);

  const initialData = {
    cars: carsData,
    users: usersData,
    events: eventsData,
    clubs: clubsData,
  };

  return <SearchClient initialData={initialData} />;
}
