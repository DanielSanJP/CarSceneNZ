import { SearchClient } from "@/components/search/search-client";
import { createClient } from "@/lib/utils/supabase/server";

// Force this page to be dynamic - don't try to fetch data at build time
export const dynamic = "force-dynamic";
export const revalidate = 300; // 5 minutes

async function getSearchData() {
  try {
    console.log(`🔍 Search Data: Fetching all searchable data directly...`);

    const supabase = await createClient();

    // Fetch cars (public data only)
    const { data: cars, error: carsError } = await supabase
      .from("cars")
      .select(
        `
        id,
        owner_id,
        brand,
        model,
        year,
        images,
        total_likes,
        created_at,
        updated_at,
        owner:users!cars_owner_id_fkey(
          id,
          username,
          display_name,
          profile_image_url
        )
      `
      )
      .limit(1000); // Reasonable limit for search

    if (carsError) {
      console.error("Error fetching cars for search:", carsError);
    }

    // Fetch users (public profiles only)
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(
        "id, username, display_name, profile_image_url, created_at, updated_at"
      )
      .limit(1000);

    if (usersError) {
      console.error("Error fetching users for search:", usersError);
    }

    // Fetch events (public events only)
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select(
        `
        id,
        host_id,
        title,
        description,
        location,
        daily_schedule,
        created_at,
        updated_at,
        host:users!events_host_id_fkey(
          id,
          username,
          display_name
        )
      `
      )
      .limit(1000);

    if (eventsError) {
      console.error("Error fetching events for search:", eventsError);
    }

    // Fetch clubs (public clubs)
    const { data: clubs, error: clubsError } = await supabase
      .from("clubs")
      .select(
        `
        id,
        name,
        description,
        club_type,
        banner_image_url,
        leader_id,
        total_likes,
        location,
        created_at,
        updated_at
      `
      )
      .limit(1000);

    if (clubsError) {
      console.error("Error fetching clubs for search:", clubsError);
    }

    // Transform data to fix relationships (Supabase returns arrays, we need single objects)
    const transformedCars =
      cars?.map((car) => ({
        ...car,
        owner:
          Array.isArray(car.owner) && car.owner.length > 0
            ? car.owner[0]
            : undefined,
      })) || [];

    const transformedEvents =
      events?.map((event) => ({
        ...event,
        host:
          Array.isArray(event.host) && event.host.length > 0
            ? event.host[0]
            : undefined,
      })) || [];

    const searchData = {
      cars: transformedCars,
      users: users || [],
      events: transformedEvents,
      clubs: clubs || [],
    };

    console.log(
      `✅ Search Data: Fetched ${searchData.cars.length} cars, ${searchData.users.length} users, ${searchData.events.length} events, ${searchData.clubs.length} clubs`
    );

    return searchData;
  } catch (error) {
    console.error("Failed to fetch search data:", error);
    return null;
  }
}

export default async function SearchPage() {
  const searchData = await getSearchData();

  return <SearchClient initialData={searchData} />;
}
