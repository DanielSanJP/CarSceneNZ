"use client";

import { useState, useRef, useEffect } from "react";
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
import { useAuth } from "@/components/auth-provider";
import { getEventById, updateEvent, deleteEvent } from "@/lib/data/events";
import type { Event } from "@/types/event";

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

interface EditEventFormProps {
  eventId: string;
}

export function EditEventForm({ eventId }: EditEventFormProps) {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<EventFormData>({
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
  });

  // Fetch event data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await getEventById(eventId);
        if (eventData) {
          setEvent(eventData);

          // Convert event data to form format
          const scheduleWithDates = eventData.daily_schedule.map((item) => ({
            date: new Date(item.date),
            start_time: item.start_time || "",
            end_time: item.end_time || "",
            description: "",
          }));

          setFormData({
            title: eventData.title,
            description: eventData.description || "",
            poster_image_url: eventData.poster_image_url || "",
            location: eventData.location || "",
            daily_schedule:
              scheduleWithDates.length > 0
                ? scheduleWithDates
                : [
                    {
                      date: undefined,
                      start_time: "",
                      end_time: "",
                      description: "",
                    },
                  ],
          });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      } finally {
        setEventLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

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

  // Check if user is the host
  useEffect(() => {
    if (event && user && event.host_id !== user.id) {
      router.push("/events");
    }
  }, [event, user, router]);

  // Show loading while checking auth or fetching event
  if (loading || eventLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Don't render if not authenticated or no event found
  if (!isAuthenticated || !event) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user is authenticated and is the host
      if (!isAuthenticated || !user || event.host_id !== user.id) {
        alert("You are not authorized to edit this event.");
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
      const eventData: Partial<DatabaseEventData> = {
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

      // Update the event
      const updatedEvent = await updateEvent(eventId, eventData);

      if (updatedEvent) {
        alert("Event updated successfully!");
        router.push(`/events/${eventId}`);
      } else {
        alert("Failed to update event. Please try again.");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      alert("An error occurred while updating the event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      try {
        // Check if user is authenticated and is the host
        if (!isAuthenticated || !user || event.host_id !== user.id) {
          alert("You are not authorized to delete this event.");
          return;
        }

        const success = await deleteEvent(eventId);
        if (success) {
          alert("Event deleted successfully!");
          router.push("/events");
        } else {
          alert("Failed to delete event. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("An error occurred while deleting the event. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/events/${eventId}`}>
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
              tempEventId={eventId}
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
            <Link href={`/events/${eventId}`}>
              <Button type="button" variant="outline">
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
