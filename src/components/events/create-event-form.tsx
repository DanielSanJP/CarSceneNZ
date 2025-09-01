"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MapLocationSelector } from "./map-location-selector";
import { EventDateTime } from "./event-date-time";
import { useAuth } from "@/lib/hooks/useAuth";
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
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const locationInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const handleDeleteImage = () => {
    setFormData((prev) => ({
      ...prev,
      poster_image_url: "",
    }));
    setFailedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(formData.poster_image_url);
      return newSet;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Image size should be less than 5MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        poster_image_url: imageUrl,
      }));
    };
    reader.readAsDataURL(file);

    // Clear the input
    e.target.value = "";
  };

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
          <CardContent className="space-y-4">
            {/* Current Image */}
            {formData.poster_image_url ? (
              <div className="max-w-md mx-auto">
                <div className="relative group overflow-hidden rounded-lg border">
                  <div className="relative aspect-square">
                    {failedImages.has(formData.poster_image_url) ? (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Camera className="h-12 w-12 text-muted-foreground" />
                      </div>
                    ) : (
                      <Image
                        src={formData.poster_image_url}
                        alt="Event poster"
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() =>
                          handleImageError(formData.poster_image_url)
                        }
                      />
                    )}

                    {/* Delete button */}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleDeleteImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center max-w-md mx-auto">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No poster image uploaded yet
                </p>
              </div>
            )}

            {/* Upload new image */}
            <div className="space-y-2 max-w-md mx-auto">
              <Label htmlFor="image-upload">
                Event Poster {formData.poster_image_url ? "(Replace)" : ""}
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </label>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a square poster image (recommended: 1080x1080px). Max
                file size: 5MB.
              </p>
            </div>
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
