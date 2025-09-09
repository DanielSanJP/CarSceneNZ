import { UserProfileDisplay } from "@/components/profile/user-profile-display";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: userId } = await params;

  // Let the client component handle all data fetching through the optimized API
  // This reduces server-side work and uses our optimized RPC functions
  return <UserProfileDisplay userId={userId} />;
}
