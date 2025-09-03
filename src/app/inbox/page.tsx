import { getAllMessages } from "@/lib/server/messages";
import { InboxView } from "@/components/inbox/inbox-view";

// Force dynamic rendering since we use authentication/cookies
export const dynamic = "force-dynamic";

export default async function InboxPage() {
  // Fetch data on the server
  const messages = await getAllMessages();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <InboxView messages={messages} />
        </div>
      </div>
    </div>
  );
}
