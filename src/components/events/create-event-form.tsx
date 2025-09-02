"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useAuth } from "@/components/auth-provider";
import { createEvent } from "@/lib/data/events";

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

interface DatabaseEventData {
  host_id: string;
  title: string;
  description?: string;
  poster_image_url?: string;
  location?: string;
  daily_schedule: Array<{
    date: string;
    start_time?: string;
    end_time?: string;
  }>;
}

export function CreateEventForm() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        alert("You must be logged in to create an event.");
        return;
      }

      // Validate required fields
      if (!formData.title.trim()) {
        alert("Event title is required.");
        return;
      }

      // Check if there are any valid schedule items
      const validScheduleItems = formData.daily_schedule.filter(
        (item) => item.date
      );
      if (validScheduleItems.length === 0) {
        alert("At least one event date is required.");
        return;
      }

      // Transform form data to database format
      const eventData: DatabaseEventData = {
        host_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        poster_image_url: formData.poster_image_url || undefined,
        location: formData.location.trim() || undefined,
        daily_schedule: validScheduleItems.map((item) => ({
          date: item.date!.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
          start_time: item.start_time || undefined,
          end_time: item.end_time || undefined,
        })),
      };

      // Create the event
      const createdEvent = await createEvent(eventData);

      if (createdEvent) {
        alert("Event created successfully!");
        router.push("/events");
      } else {
        alert("Failed to create event. Please try again.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("An error occurred while creating the event. Please try again.");
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
