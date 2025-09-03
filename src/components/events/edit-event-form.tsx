"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { MapLocationSelector } from "./map-location-selector";
import { EventDateTime } from "./event-date-time";
import { EventImageManager } from "./event-image-manager";
import { useRequireAuth } from "@/hooks/use-auth";
import { updateEvent, deleteEvent } from "@/lib/server/events";
import type { Event } from "@/types/event";

// Helper function to format date in local timezone (avoids UTC conversion issues)
function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface EditEventFormProps {
  event: Event;
}

export function EditEventForm({ event }: EditEventFormProps) {
  const user = useRequireAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(() => {
    // Initialize form data from the event prop
    const scheduleWithDates = event.daily_schedule.map(
      (item: { date: string; start_time?: string; end_time?: string }) => ({
        date: new Date(item.date),
        start_time: item.start_time || "",
        end_time: item.end_time || "",
        description: "",
      })
    );

    return {
      title: event.title,
      description: event.description || "",
      poster_image_url: event.poster_image_url || "",
      location: event.location || "",
      daily_schedule:
        scheduleWithDates.length > 0
          ? scheduleWithDates
          : [
              {
                date: undefined as Date | undefined,
                start_time: "",
                end_time: "",
                description: "",
              },
            ],
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !event) return;

    setIsLoading(true);
    try {
      // Validate
      if (!formData.title.trim()) {
        alert("Event title is required.");
        return;
      }

      const validScheduleItems = formData.daily_schedule.filter(
        (item) => item.date
      );
      if (validScheduleItems.length === 0) {
        alert("At least one event date is required.");
        return;
      }

      // Prepare data
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        poster_image_url: formData.poster_image_url || undefined,
        location: formData.location.trim() || undefined,
        daily_schedule: validScheduleItems.map((item) => ({
          date: formatDateToLocal(item.date!), // Use timezone-safe formatting
          start_time: item.start_time || undefined,
          end_time: item.end_time || undefined,
        })),
      };

      // Call server function directly
      const result = await updateEvent(event.id, eventData);

      if (result) {
        alert("Event updated successfully!");
        // Navigate to the updated event
        router.push(`/events/${event.id}`);
        router.refresh();
      } else {
        alert("Failed to update event. Please try again.");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("An error occurred while updating the event.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !event) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      // Call server function directly
      await deleteEvent(event.id);

      alert("Event deleted successfully!");
      // Navigate to my events page
      router.push("/events/my-events");
      router.refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("An error occurred while deleting the event.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/events/${event.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Event</h1>
          <p className="text-muted-foreground">
            Update your event details and settings
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Poster Image */}
        <Card>
          <CardHeader>
            <CardTitle>Event Poster</CardTitle>
          </CardHeader>
          <CardContent>
            <EventImageManager
              currentImage={formData.poster_image_url}
              onImageChange={(imageUrl) =>
                setFormData((prev) => ({ ...prev, poster_image_url: imageUrl }))
              }
              onImageRemove={() =>
                setFormData((prev) => ({ ...prev, poster_image_url: "" }))
              }
              isLoading={isLoading}
              tempEventId={event.id}
            />
          </CardContent>
        </Card>

        {/* Basic Event Information */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Auckland JDM Meet, Wellington Stance Day"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Event Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your event, what to expect, rules, etc."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <MapLocationSelector
                selectedLocation={formData.location}
                onLocationSelect={(location) =>
                  setFormData((prev) => ({ ...prev, location }))
                }
                placeholder="Search for a location in New Zealand..."
              />
            </div>
          </CardContent>
        </Card>

        <EventDateTime
          formData={{ daily_schedule: formData.daily_schedule }}
          onFormDataChange={(data) =>
            setFormData((prev) => ({ ...prev, ...data }))
          }
        />

        {/* Submit Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Event
          </Button>

          <div className="flex space-x-4">
            <Link href={`/events/${event.id}`}>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Event"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
