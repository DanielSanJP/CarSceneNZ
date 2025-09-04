import { SearchClient } from "@/components/search/search-client";
import { createClient } from "@/lib/utils/supabase/server";
import type { Car } from "@/types/car";
import type { Event } from "@/types/event";
import type { Club } from "@/types/club";
import type { User } from "@/types/user";
import { cache } from "react";

const getAllCars = cache(async (): Promise<Car[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all cars:", error);
    return [];
  }

  return data as Car[];
});

const getAllEvents = cache(async (): Promise<Event[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all events:", error);
    return [];
  }

  return data as Event[];
});

const getAllUsers = cache(async (): Promise<User[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all users:", error);
    return [];
  }

  return data as User[];
});

const getAllClubs = cache(async (): Promise<Club[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all clubs:", error);
    return [];
  }

  return data as Club[];
});

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
