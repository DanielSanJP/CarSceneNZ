import { EventDetailView } from "@/components/events/display/event-detail-view";
import { toggleEventAttendanceAction } from "@/lib/actions";
import { notFound } from "next/navigation";
import type { EventDetailData } from "@/types/event";
import { getAuthUser, getUserProfile } from "@/lib/auth";
import { getBaseUrl } from "@/lib/utils";

// Cache this page for 5 minutes, then revalidate in the background
export const revalidate = 300; // 5 minutes

// Helper function to get event details using cached API route
async function getEventDetailData(
  eventId: string,
  userId?: string
): Promise<EventDetailData> {
  const startTime = Date.now();

  console.log(
    `🚀 FETCH CACHE: Fetching event ${eventId} details using API route...`
  );

  try {
    // Use our API route with Next.js native fetch for caching
    const url = `${getBaseUrl()}/api/events/${eventId}`;

    console.log(`🔍 DEBUG: Calling API route: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId || null,
      }),
      // Enable Next.js caching with 5 minute revalidation
      next: {
        revalidate: 300, // 5 minutes
        tags: ["events", `event-${eventId}`],
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Event not found");
      }
      throw new Error(`Failed to fetch event: ${response.status}`);
    }

    const eventDetailData = await response.json();

    const endTime = Date.now();
    console.log(
      `✅ FETCH CACHE: Event ${eventId} details fetched in ${
        endTime - startTime
      }ms`
    );

    return eventDetailData;
  } catch (error) {
    console.error("❌ Error fetching event details:", error);
    throw error;
  }
}

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  try {
    // Get user directly in server component (like events page does)
    const authUser = await getAuthUser();
    const user = authUser ? await getUserProfile(authUser.id) : null;

    // Get event details using our cached API route
    const eventDetailData = await getEventDetailData(id, user?.id);

    // Add user data to the response (API route doesn't handle user context)
    const completeEventDetailData: EventDetailData = {
      ...eventDetailData,
      user: user
        ? {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url,
          }
        : null,
    };

    return (
      <>
        <EventDetailView
          eventDetailData={completeEventDetailData}
          attendEventAction={toggleEventAttendanceAction}
        />
      </>
    );
  } catch (error) {
    console.error("Error loading event:", error);
    notFound();
  }
}
