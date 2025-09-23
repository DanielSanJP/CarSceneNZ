import { InboxView } from "@/components/inbox/inbox-view";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/utils/supabase/server";
import type { InboxMessage } from "@/types/inbox";

// No caching - we want fresh data for inbox
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  // Get the current user
  const authUser = await requireAuth();
  const supabase = await createClient();

  console.log("📬 Server: Fetching inbox messages for user:", authUser.id);

  try {
    // Direct Supabase query - no API route needed
    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        sender_id,
        receiver_id,
        subject,
        message,
        message_type,
        club_id,
        created_at,
        updated_at,
        is_read,
        sender:sender_id (
          id,
          username,
          display_name,
          profile_image_url
        ),
        club:club_id (
          id,
          name
        )
      `
      )
      .eq("receiver_id", authUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching messages:", error);
      throw error;
    }

    console.log(`✅ Server: Retrieved ${messages?.length || 0} messages`);

    // Transform the data to handle Supabase's array returns
    const transformedMessages: InboxMessage[] =
      messages?.map((msg) => {
        const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender;
        const club = Array.isArray(msg.club) ? msg.club[0] : msg.club;

        return {
          ...msg,
          sender: sender || null,
          club: club || null,
          // Add flat fields for compatibility
          sender_username: sender?.username || null,
          sender_display_name: sender?.display_name || null,
          sender_profile_image_url: sender?.profile_image_url || null,
          club_name: club?.name || null,
        };
      }) || [];

    return (
      <InboxView
        initialMessages={transformedMessages}
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
