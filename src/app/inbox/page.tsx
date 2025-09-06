import { getUserInboxMessages } from "@/lib/server/inbox";
import { markInboxAsRead, handleJoinRequestAction } from "@/lib/server/inbox";
import { InboxView } from "@/components/inbox/inbox-view";
import { getUser } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

// Server action to revalidate badge count
async function revalidateBadgeAction() {
  "use server";

  const user = await getUser();
  if (user) {
    revalidateTag(`unread-messages-${user.id}`);
  }
}

// Server action wrapper for handling join requests
async function handleJoinRequestServerAction(
  messageId: string,
  action: "approve" | "reject",
  clubId: string,
  senderId: string
) {
  "use server";

  const result = await handleJoinRequestAction(
    messageId,
    action,
    clubId,
    senderId
  );

  // Force revalidation of the inbox page to refresh the messages list
  revalidatePath("/inbox");

  return result;
}

export default async function InboxPage() {
  // Get the current user
  const user = await getUser();

  // Mark inbox as read (database update only, no cache revalidation)
  if (user) {
    await markInboxAsRead(user.id);
  }

  // Fetch messages with proper typing and message_type detection
  const messages = await getUserInboxMessages();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <InboxView
            messages={messages}
            revalidateBadgeAction={revalidateBadgeAction}
            handleJoinRequestAction={handleJoinRequestServerAction}
          />
        </div>
      </div>
    </div>
  );
}
