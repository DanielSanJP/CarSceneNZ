"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MapLocationSelector } from "./map-location-selector";
import { EventDateTime } from "./event-date-time";
import { EventImageManager } from "./event-image-manager";
import { useCurrentUser } from "@/hooks/use-auth";

interface CreateEventFormProps {
  action: (formData: FormData) => Promise<void>;
}

interface EventFormData {
  title: string;
  description: string;
  poster_image_url: string;
  location: string;
  daily_schedule: Array<{
    date: Date | undefined;
    start_time: string;
    end_time: string;
    description: string;
  }>;
}

export function CreateEventForm({ action }: CreateEventFormProps) {
  const user = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Generate a temporary ID for image uploads during creation
  const [tempEventId] = useState(
    () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const [formData, setFormData] = useState<EventFormData>(() => ({
    title: "",
    description: "",
    poster_image_url: "",
    location: "",
    daily_schedule: [
      {
        date: undefined,
        start_time: "",
        end_time: "",
        description: "",
      },
    ],
  }));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideInput = locationInputRef.current?.contains(target);

      if (!isClickInsideInput) {
        // No location suggestions to close anymore
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleAction = async (formDataFromForm: FormData) => {
    try {
      setError("");
      setIsLoading(true);

      // Check if user is authenticated
      if (!user) {
        setError("You must be logged in to create an event.");
        return;
      }

      // Validate required fields using formData state
      if (!formData.title.trim()) {
        setError("Event title is required.");
        return;
      }

      // Check if there are any valid schedule items
      const validScheduleItems = formData.daily_schedule.filter(
        (item) => item.date
      );
      if (validScheduleItems.length === 0) {
        setError("At least one event date is required.");
        return;
      }

      // Add current form state to FormData for the server action
      formDataFromForm.set("title", formData.title.trim());
      formDataFromForm.set("description", formData.description.trim());
      formDataFromForm.set("location", formData.location.trim());
      formDataFromForm.set("poster_image_url", formData.poster_image_url);
      formDataFromForm.set(
        "daily_schedule",
        JSON.stringify(validScheduleItems)
      );

      await action(formDataFromForm);
    } catch (error) {
      console.error("Error creating event:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while creating the event. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/events">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create New Event</h1>
          <p className="text-muted-foreground">
            Create a new car meet event and bring the community together
          </p>
        </div>
      </div>

      <form action={handleAction} className="space-y-8">
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
              tempEventId={tempEventId}
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
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
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

            {/* Location with map functionality */}
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
          formData={{
            daily_schedule: formData.daily_schedule,
          }}
          onFormDataChange={(data) =>
            setFormData((prev) => ({ ...prev, ...data }))
          }
        />

        {/* Error Display */}
        {error && (
          <div className="text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Link href="/events">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
