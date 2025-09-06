import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EditEventForm } from "@/components/events/edit-event-form";
import { getUser } from "@/lib/auth";
import { getEventById, updateEvent, deleteEvent } from "@/lib/server/events";
import { uploadEventImage } from "@/lib/server/image-upload";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}

// Helper function to format date in local timezone (avoids UTC conversion issues)
function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

async function updateEventAction(
  eventId: string,
  from: string | undefined,
  formData: FormData
) {
  "use server";

  // Extract form data
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const location = formData.get("location") as string;
  const poster_image_url = formData.get("poster_image_url") as string;
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

  const eventData = {
    title: title.trim(),
    description: description?.trim() || undefined,
    poster_image_url: poster_image_url || undefined,
    location: location?.trim() || undefined,
    daily_schedule,
  };

  await updateEvent(eventId, eventData);

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);

  if (from === "my-events") {
    redirect("/events/my-events");
  } else {
    redirect(`/events/${eventId}`);
  }
}

async function deleteEventAction(eventId: string, from: string | undefined) {
  "use server";

  await deleteEvent(eventId);

  revalidatePath("/events");

  if (from === "my-events") {
    redirect("/events/my-events");
  } else {
    redirect("/events");
  }
}

export default async function EditEventPage({
  params,
  searchParams,
}: EditEventPageProps) {
  // Server-side auth check
  const user = await getUser();

  const { id: eventId } = await params;
  const { from } = await searchParams;

  if (!eventId) {
    notFound();
  }

  // Server-side permission check
  const event = await getEventById(eventId);
  if (!event) {
    notFound();
  }

  if (event.host_id !== user.id) {
    redirect("/events");
  }

  const updateAction = updateEventAction.bind(null, eventId, from);
  const deleteAction = deleteEventAction.bind(null, eventId, from);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <EditEventForm
          event={event}
          user={user}
          updateAction={updateAction}
          deleteAction={deleteAction}
          uploadAction={uploadEventImageServerAction}
          from={from}
        />
      </div>
    </div>
  );
}
