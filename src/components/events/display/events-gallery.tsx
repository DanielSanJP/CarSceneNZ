"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Filter,
  ImageIcon,
  Star,
  Check,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/types/event";

interface EventsGalleryProps {
  events: Event[];
  user?: {
    id: string;
    username: string;
    display_name?: string;
  } | null;
  attendeeCounts?: Record<
    string,
    { interested: number; going: number; total: number }
  >;
  userEventStatuses?: Record<string, string>;
  attendEventAction?: (
    eventId: string,
    userId: string,
    status: "interested" | "going" | "approved"
  ) => Promise<{ success: boolean; error?: string }>;
  unattendEventAction?: (
    eventId: string,
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;
}

export function EventsGallery({
  events,
  user,
  attendeeCounts,
  userEventStatuses,
  attendEventAction,
  unattendEventAction,
}: EventsGalleryProps) {
  const router = useRouter();

  // State for filters
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("nearest");

  // State for tracking failed image loads
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // State for optimistic updates of user event statuses
  const [localUserStatuses, setLocalUserStatuses] = useState<
    Record<string, string | null>
  >({});

  // Handle image error
  const handleImageError = (eventId: string) => {
    setFailedImages((prev) => new Set(prev).add(eventId));
  };

  // Get unique locations from events
  const locations = useMemo(() => {
    const uniqueLocations = [
      ...new Set(
        events
          .map((event) => event.location)
          .filter((location): location is string => location !== undefined)
          .map((location) => {
            // Extract city from location string
            const parts = location.split(", ");
            return parts[parts.length - 1]; // Get the last part which should be the city
          })
      ),
    ];
    return uniqueLocations.sort();
  }, [events]);

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Apply location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter((event) =>
        event.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Apply sorting
    if (sortOrder === "nearest") {
      // Sort by created date (newest first)
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOrder === "furthest") {
      // Sort by created date (oldest first)
      filtered.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return filtered;
  }, [events, locationFilter, sortOrder]);

  // Helper function to format date and time period for daily schedule
  const formatDate = (schedule: unknown) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0)
      return { day: "", date: "", time: "", full: "" };

    const firstDay = (
      schedule as { date: string; start_time: string; end_time: string }[]
    )[0];
    const lastDay = (
      schedule as { date: string; start_time: string; end_time: string }[]
    )[schedule.length - 1];

    const startDate = new Date(`${firstDay.date}T${firstDay.start_time}`);
    const date = startDate.toLocaleDateString("en-NZ", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const time = `${firstDay.start_time} - ${lastDay.end_time}`;

    return { day: date, date, time, full: `${date} at ${time}` };
  };

  // Helper function to get event attendees count (using real data)
  const getAttendeeCount = (eventId: string) => {
    return attendeeCounts?.[eventId]?.going || 0;
  };

  // Helper function to get interested count (using real data)
  const getInterestedCount = (eventId: string) => {
    return attendeeCounts?.[eventId]?.interested || 0;
  };

  // Helper function to get user's status for an event (with optimistic updates)
  const getUserStatus = (eventId: string) => {
    // Check local state first (for optimistic updates), then fall back to prop
    if (localUserStatuses[eventId] !== undefined) {
      return localUserStatuses[eventId];
    }
    return userEventStatuses?.[eventId] || null;
  };

  // Handle user attendance actions with optimistic updates
  const handleAttendanceAction = async (
    eventId: string,
    status: "interested" | "going"
  ) => {
    if (!user) {
      // Redirect to register page when user is not logged in
      router.push("/register");
      return;
    }

    if (!attendEventAction || !unattendEventAction) {
      console.error("Server actions not provided");
      return;
    }

    try {
      const currentStatus = getUserStatus(eventId);

      // Optimistic update - update UI immediately
      if (currentStatus === status) {
        // User is removing their attendance
        setLocalUserStatuses((prev) => ({ ...prev, [eventId]: null }));
      } else {
        // User is setting/changing their attendance
        setLocalUserStatuses((prev) => ({ ...prev, [eventId]: status }));
      }

      // Then make the actual server call
      if (currentStatus === status) {
        // User is removing their attendance (same as detail page)
        const result = await unattendEventAction(eventId, user.id);
        if (!result.success) {
          console.error("Failed to unattend event:", result.error);
          // Revert optimistic update on failure
          setLocalUserStatuses((prev) => ({
            ...prev,
            [eventId]: currentStatus,
          }));
        }
      } else {
        // User is setting/changing their attendance (same as detail page)
        const result = await attendEventAction(eventId, user.id, status);
        if (!result.success) {
          console.error("Failed to attend event:", result.error);
          // Revert optimistic update on failure
          setLocalUserStatuses((prev) => ({
            ...prev,
            [eventId]: currentStatus,
          }));
        }
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      // Revert optimistic update on error
      const currentStatus = userEventStatuses?.[eventId] || null;
      setLocalUserStatuses((prev) => ({ ...prev, [eventId]: currentStatus }));
    }
  }; // Helper function to get host info
  const getHostInfo = (
    host:
      | {
          id: string;
          username: string;
          display_name?: string;
          profile_image_url?: string;
        }
      | undefined
  ) => {
    return (
      host || {
        id: "",
        username: "unknown",
        display_name: "Unknown Host",
        profile_image_url: undefined,
      }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Car Events Across NZ
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and join car meets, track days, and automotive gatherings
          happening across New Zealand.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Location:
              </span>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Sort by:
              </span>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Sort by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nearest">Nearest first</SelectItem>
                  <SelectItem value="furthest">Furthest first</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredAndSortedEvents.length} of {events.length} events
            {locationFilter !== "all" && ` in ${locationFilter}`}
          </p>
        </div>
      </div>

      {/* Events Grid */}
      {filteredAndSortedEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No events found
          </h3>
          <p className="text-muted-foreground">
            Check back later for upcoming car events and meets.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedEvents.map((event) => {
            const dateInfo = formatDate(event.daily_schedule);
            const attendeeCount = getAttendeeCount(event.id);
            const interestedCount = getInterestedCount(event.id);
            const host = getHostInfo(event.host);
            const userStatus = getUserStatus(event.id);

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block"
              >
                <Card className="overflow-hidden pt-0 cursor-pointer">
                  {/* Event Image/Poster */}
                  <div className="relative aspect-square overflow-hidden">
                    {failedImages.has(event.id) || !event.poster_image_url ? (
                      // Fallback placeholder
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-16 w-16 text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground font-medium px-4">
                            {event.title}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={event.poster_image_url}
                        alt={event.title}
                        fill
                        quality={100}
                        priority={filteredAndSortedEvents.indexOf(event) < 6}
                        className="object-cover"
                        sizes="(max-width: 640px) 200vw, (max-width: 768px) 100vw, (max-width: 1024px) 66vw, (max-width: 1280px) 50vw, 40vw"
                        onError={() => handleImageError(event.id)}
                      />
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {event.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {event.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Date and Time */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm font-bold text-primary">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {dateInfo.full}
                        </div>
                        <div className="text-muted-foreground text-sm flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {dateInfo.time}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Location */}
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {event.location}
                      </span>
                    </div>

                    {/* Interested */}
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {interestedCount}{" "}
                        {interestedCount === 1 ? "person" : "people"} interested
                      </span>
                    </div>

                    {/* Attendees */}
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {attendeeCount}{" "}
                        {attendeeCount === 1 ? "person" : "people"} attending
                      </span>
                    </div>

                    {/* Host */}
                    {host && (
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {host.profile_image_url && (
                            <AvatarImage
                              src={host.profile_image_url}
                              alt={host.display_name || host.username}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback>
                            {(host.display_name || host.username || "Unknown")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Hosted by
                          </div>
                          <div className="text-sm font-medium">
                            {host.display_name ||
                              host.username ||
                              "Unknown Host"}
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        className="w-full flex-1"
                        variant={
                          userStatus === "interested" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAttendanceAction(event.id, "interested");
                        }}
                      >
                        {userStatus === "interested" ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Star className="h-4 w-4 mr-1" />
                        )}
                        Interested
                      </Button>
                      <Button
                        className="w-full flex-1"
                        variant={
                          userStatus === "going" || userStatus === "approved"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAttendanceAction(event.id, "going");
                        }}
                      >
                        {userStatus === "going" || userStatus === "approved" ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Users className="h-4 w-4 mr-1" />
                        )}
                        I&apos;m Going
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
