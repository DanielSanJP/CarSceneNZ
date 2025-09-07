"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { MapLocationSelector } from "./map-location-selector";
import { EventDateTime } from "./event-date-time";
import { EventImageManager } from "./event-image-manager";
import type { Event } from "@/types/event";
import type { User } from "@/types/user";
import { toast } from "sonner";

// Helper function to format date in local timezone (avoids UTC conversion issues)
function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface EditEventFormProps {
  event: Event;
  user: User;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: () => Promise<void>;
  uploadAction: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
  from?: string;
}

export function EditEventForm({
  event,
  user,
  updateAction,
  deleteAction,
  uploadAction,
  from,
}: EditEventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
        toast.error("Event title is required.");
        return;
      }

      const validScheduleItems = formData.daily_schedule.filter(
        (item) => item.date
      );
      if (validScheduleItems.length === 0) {
        toast.error("At least one event date is required.");
        return;
      }

      // Create FormData for server action
      const formDataObj = new FormData();
      formDataObj.append("title", formData.title.trim());
      formDataObj.append("description", formData.description.trim());
      formDataObj.append("poster_image_url", formData.poster_image_url || "");
      formDataObj.append("location", formData.location.trim());
      formDataObj.append(
        "daily_schedule",
        JSON.stringify(
          validScheduleItems.map((item) => ({
            date: formatDateToLocal(item.date!), // Use timezone-safe formatting
            start_time: item.start_time || undefined,
            end_time: item.end_time || undefined,
          }))
        )
      );

      // Call the server action
      await updateAction(formDataObj);
    } catch (error) {
      // Check if this is a Next.js redirect (expected behavior)
      if (
        error &&
        typeof error === "object" &&
        ("digest" in error || error.constructor.name === "RedirectError")
      ) {
        // This is a redirect, which is expected - don't show error
        return;
      }

      toast.error("An error occurred while updating the event.");
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !event) return;

    setIsLoading(true);
    try {
      // Call the server action
      await deleteAction();
    } catch (error) {
      // Check if this is a Next.js redirect (expected behavior)
      if (
        error &&
        typeof error === "object" &&
        ("digest" in error || error.constructor.name === "RedirectError")
      ) {
        // This is a redirect, which is expected - don't show error
        return;
      }

      toast.error("An error occurred while deleting the event.");
      setIsLoading(false);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={
            from === "my-events" ? "/events/my-events" : `/events/${event.id}`
          }
        >
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
              uploadAction={uploadAction}
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
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Event
          </Button>

          <div className="flex space-x-4">
            <Link
              href={
                from === "my-events"
                  ? "/events/my-events"
                  : `/events/${event.id}`
              }
            >
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

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        itemName={event.title}
        isLoading={isLoading}
      />
    </div>
  );
}
