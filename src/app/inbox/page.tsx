import {
  markInboxAsRead,
  handleJoinRequestAction,
  handleClubInvitation,
  getUserInboxMessages,
} from "@/lib/server/inbox";
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

// Server action to refresh messages - this is what realtime will call
async function refreshMessagesAction() {
  "use server";

  // Revalidate the inbox page to trigger fresh data fetch
  revalidatePath("/inbox");
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

// Server action wrapper for handling club invitations
async function handleClubInvitationServerAction(
  messageId: string,
  action: "accept" | "reject",
  clubId: string,
  inviterId: string
) {
  "use server";

  const result = await handleClubInvitation(
    messageId,
    action,
    clubId,
    inviterId
  );

  // Force revalidation of the inbox page to refresh the messages list
  revalidatePath("/inbox");

  return result;
}

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

  // Mark inbox as read (database update only, no cache revalidation)
  await markInboxAsRead(user.id);

  // Fetch initial messages
  const initialMessages = await getUserInboxMessages();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <InboxView
            userId={user.id}
            initialMessages={initialMessages}
            refreshMessages={refreshMessagesAction}
            revalidateBadgeAction={revalidateBadgeAction}
            handleJoinRequestAction={handleJoinRequestServerAction}
            handleClubInvitationAction={handleClubInvitationServerAction}
          />
        </div>
      </div>
    </div>
  );
}
