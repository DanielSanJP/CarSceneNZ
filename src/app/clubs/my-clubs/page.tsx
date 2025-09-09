import { MyClubView } from "@/components/clubs/my-club-view";
import { getUser } from "@/lib/auth";
import { getUserClubMemberships } from "@/lib/server/clubs";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

// Cache for 2 minutes since user's clubs don't change frequently
export const revalidate = 120;

export default async function MyClubsPage() {
  // Server-side auth check - redirects if not authenticated
  const user = await getUser();

  // Fetch user's club memberships using optimized cached function
  const userClubs = await getUserClubMemberships(user.id);

  return <MyClubView userClubs={userClubs} />;
}
