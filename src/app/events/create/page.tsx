import { requireAuth, getUserProfile } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { CreateEventForm } from "@/components/events/create-event-form";
import { uploadEventImage } from "@/lib/utils/image-upload";
import { createClient } from "@/lib/utils/supabase/server";
import { Event } from "@/types";

// Helper function to format date in local timezone (avoids UTC conversion issues)
function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Inline server function from events.ts
async function createEvent(eventData: {
  host_id: string;
  title: string;
  description?: string;
  poster_image_url?: string;
  location?: string;
  daily_schedule: unknown[];
}): Promise<Event> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .insert({
        host_id: eventData.host_id,
        title: eventData.title,
        description: eventData.description,
        poster_image_url: eventData.poster_image_url,
        location: eventData.location,
        daily_schedule: eventData.daily_schedule,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      throw new Error("Failed to create event");
    }

    if (!data) {
      throw new Error("No data returned from event creation");
    }

    return {
      id: data.id,
      host_id: data.host_id,
      title: data.title,
      description: data.description,
      poster_image_url: data.poster_image_url,
      location: data.location,
      daily_schedule: data.daily_schedule || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
      host: {
        id: data.host_id,
        username: "",
        display_name: "",
        profile_image_url: undefined,
      },
    };
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

async function uploadEventImageServerAction(formData: FormData) {
  "use server";

  try {
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;
    const isTemp = formData.get("isTemp") === "true";

    if (!file || !eventId) {
      return { url: null, error: "Missing file or event ID" };
    }

    const url = await uploadEventImage(file, eventId, isTemp);
    return { url, error: null };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

async function createEventAction(formData: FormData) {
  "use server";

  const authUser = await requireAuth();

  // Extract form data
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const poster_image_url = formData.get("poster_image_url") as string;

  // Extract schedule data (this will be JSON stringified from the form)
  const scheduleJson = formData.get("daily_schedule") as string;

  if (!title?.trim()) {
    throw new Error("Event title is required");
  }

  let daily_schedule = [];
  if (scheduleJson) {
    try {
      const parsedSchedule = JSON.parse(scheduleJson);
      daily_schedule = parsedSchedule
        .filter((item: { date?: string }) => item.date)
        .map(
          (item: { date: string; start_time?: string; end_time?: string }) => ({
            date: formatDateToLocal(new Date(item.date)),
            start_time: item.start_time || undefined,
            end_time: item.end_time || undefined,
          })
        );
    } catch (error) {
      console.error("Error parsing schedule:", error);
    }
  }

  if (daily_schedule.length === 0) {
    throw new Error("At least one event date is required");
  }

  // Create the event
  const eventData = {
    host_id: authUser.id,
    title: title.trim(),
    description: description?.trim() || undefined,
    poster_image_url: poster_image_url || undefined,
    location: location?.trim() || undefined,
    daily_schedule,
  };

  const result = await createEvent(eventData);

  // Comprehensive cache invalidation for live updates
  revalidatePath("/events"); // Events gallery page
  revalidatePath("/events/my-events"); // User's events page
  revalidatePath("/"); // Homepage (featured events)
  revalidateTag("events"); // All event-related cache
  revalidateTag("home-data"); // Homepage cache
  revalidateTag("my-events"); // My events cache tag
  revalidateTag(`user-${authUser.id}-events`); // User-specific events cache

  // Return the result for client-side navigation instead of redirect
  return { success: true, eventId: result.id };
}

export default async function CreateEventPage() {
  // Ensure user is authenticated (requireAuth will redirect if not)
  const authUser = await requireAuth();
  const user = await getUserProfile(authUser.id);

  if (!user) {
    throw new Error("Failed to load user profile");
  }

  return (
    <>
      <CreateEventForm
        action={createEventAction}
        user={user}
        uploadAction={uploadEventImageServerAction}
      />
    </>
  );
}
