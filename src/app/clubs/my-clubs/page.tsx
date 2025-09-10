import { MyClubView } from "@/components/clubs/my-club-view";
import { getUser } from "@/lib/auth";
import { getUserClubsData, type UserClubsData } from "@/hooks/use-clubs";

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

export default async function MyClubsPage() {
  // Server-side auth check - redirects if not authenticated
  const user = await getUser();

  // Fetch initial data for SSR
  let initialData: UserClubsData | null = null;
  try {
    initialData = await getUserClubsData(user.id);
  } catch (error) {
    console.error("Failed to fetch user clubs data on server:", error);
    // Continue without initial data, let client handle the error
  }

  return <MyClubView userId={user.id} initialData={initialData} />;
}

export const revalidate = 300; // 5 minutes
