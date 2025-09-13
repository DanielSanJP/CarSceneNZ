import { InboxView } from "@/components/inbox/inbox-view";
import { getUser } from "@/lib/auth";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  // Get the current user
  const user = await getUser();

  if (!user) {
    return <div className="text-center">Please log in to view your inbox.</div>;
  }

  return <InboxView userId={user.id} />;
}
