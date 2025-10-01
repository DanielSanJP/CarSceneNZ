import { InboxView } from "@/components/inbox/inbox-view";
import { requireAuth } from "@/lib/auth";
import { getInboxMessages } from "@/lib/actions";
import type { InboxMessage } from "@/types/inbox";

// No caching - we want fresh data for inbox
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  // Get the current user
  const authUser = await requireAuth();

  console.log("📬 Server: Fetching inbox messages for user:", authUser.id);

  try {
    // Use server action instead of direct query
    const result = await getInboxMessages();

    if (!result.success) {
      console.error("❌ Error fetching messages:", result.error);
      throw new Error(result.error);
    }

    console.log(
      `✅ Server: Retrieved ${
        result.messages?.length || 0
      } messages via server action`
    );

    return (
      <InboxView
        initialMessages={result.messages as InboxMessage[]}
        currentUserId={authUser.id}
      />
    );
  } catch (error) {
    console.error("❌ Failed to fetch inbox messages:", error);
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Failed to load inbox</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading your inbox messages:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }
}
