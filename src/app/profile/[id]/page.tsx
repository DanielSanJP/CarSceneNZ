import { UserProfileDisplay } from "@/components/profile/user-profile-display";
import { getProfileData } from "@/hooks/use-profile";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id: userId } = await params;

  // Fetch data server-side for SSR with caching
  const initialData = await getProfileData(userId);

  return <UserProfileDisplay userId={userId} initialData={initialData} />;
}

export const revalidate = 300; // 5 minutes
