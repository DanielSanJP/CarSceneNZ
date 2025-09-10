import { InboxView } from "@/components/inbox/inbox-view";
import { getUser } from "@/lib/auth";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  // Get the current user
  const user = await getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Please log in to view your inbox.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <InboxView userId={user.id} />
        </div>
      </div>
    </div>
  );
}
