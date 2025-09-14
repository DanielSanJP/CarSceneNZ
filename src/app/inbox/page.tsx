import { InboxView } from "@/components/inbox/inbox-view";
import { requireAuth } from "@/lib/auth";
import type { InboxMessagesData } from "@/types/inbox";
import { headers, cookies } from "next/headers";

// Enable ISR with 60 second revalidation for better performance
export const revalidate = 60; // Cache for 1 minute, then revalidate in background

import { getBaseUrl } from "@/lib/utils";

export default async function InboxPage() {
  // Get the current user
  const authUser = await requireAuth();

  console.log("📬 SSR: Fetching inbox messages for user:", authUser.id);

  // Use cached API route for better performance
  let inboxData: InboxMessagesData | null = null;
  try {
    const cookieStore = await cookies();
    const headersList = await headers();

    // Forward authentication cookies and headers to API route for RLS
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await fetch(`${getBaseUrl()}/api/inbox/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
        // Forward auth headers for RLS
        Authorization: headersList.get("authorization") || "",
        "User-Agent": headersList.get("user-agent") || "",
      },
      body: JSON.stringify({
        userId: authUser.id,
      }),
      // Enable Next.js caching with 1 minute revalidation
      next: {
        revalidate: 60,
        tags: [`inbox-${authUser.id}`],
      },
    });

    if (!response.ok) {
      console.error(
        `❌ Inbox messages API route failed: ${response.status} ${response.statusText}`
      );
      throw new Error("Failed to load inbox messages");
    }

    inboxData = await response.json();
    console.log("✅ SSR: API route completed successfully");
  } catch (error) {
    console.error("Failed to fetch inbox messages via API:", error);
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

  if (!inboxData) {
    return <div className="text-center">No inbox data available.</div>;
  }

  return <InboxView inboxData={inboxData} />;
}
