import { createClient } from "@/lib/utils/supabase/server";
import { HomePageClient } from "@/components/home-page-client";

// Force dynamic rendering since we use cookies for authentication
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch data directly from database with limits for homepage
  const supabase = await createClient();

  const [{ data: events }, { data: cars }, { data: clubs }, { data: users }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          `
        *,
        host:users!events_host_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `
        )
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("cars")
        .select(
          `
        *,
        owner:users!owner_id (
          id,
          username,
          display_name,
          profile_image_url
        )
      `
        )
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("clubs")
        .select(
          `
        *,
        users!clubs_leader_id_fkey (
          id,
          username,
          display_name,
          profile_image_url
        )
      `
        )
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  return (
    <HomePageClient
      events={events || []}
      cars={cars || []}
      clubs={clubs || []}
      users={users || []}
    />
  );
}
