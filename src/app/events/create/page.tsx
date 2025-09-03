import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CreateEventForm } from "@/components/events/create-event-form";
import { createEvent } from "@/lib/server/events";

// Helper function to format date in local timezone (avoids UTC conversion issues)
function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function createEventAction(formData: FormData) {
  "use server";

  const user = await getUser();

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
    host_id: user.id,
    title: title.trim(),
    description: description?.trim() || undefined,
    poster_image_url: poster_image_url || undefined,
    location: location?.trim() || undefined,
    daily_schedule,
  };

  const result = await createEvent(eventData);

  revalidatePath("/events");
  redirect(`/events/${result.id}`);
}

export default async function CreateEventPage() {
  // Ensure user is authenticated (getUser will redirect if not)
  const user = await getUser();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <CreateEventForm action={createEventAction} user={user} />
      </div>
    </div>
  );
}
