import { MyEventsView } from "@/components/events/my-events-view";
import { getUser } from "@/lib/auth";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

export default async function MyEventsPage() {
  // Server-side auth check - redirects if not authenticated
  await getUser();

  return <MyEventsView />;
}
