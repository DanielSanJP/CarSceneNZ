import { MyClubView } from "@/components/clubs/my-club-view";
import { getUser } from "@/lib/auth";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

export default async function MyClubsPage() {
  // Server-side auth check - redirects if not authenticated
  await getUser();

  return <MyClubView />;
}
