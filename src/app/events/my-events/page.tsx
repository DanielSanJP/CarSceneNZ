import { MyEventsView } from "@/components/events/my-events-view";
import { getUser } from "@/lib/auth";
import { getUserEventsData } from "@/hooks/use-events";
import type { UserEventsData } from "@/hooks/use-events";

// Force dynamic rendering for authentication and prevent caching of user-specific data
export const dynamic = "force-dynamic";

export default async function MyEventsPage() {
  // Server-side auth check - redirects if not authenticated
  const user = await getUser();

  // Fetch initial events data directly in server component
  let initialData: UserEventsData | null = null;
  try {
    initialData = await getUserEventsData(user.id);
  } catch (error) {
    console.error("Failed to fetch user events on server:", error);
    // We'll let the client-side hook handle the error and retry
  }

  return <MyEventsView userId={user.id} initialData={initialData} />;
}
