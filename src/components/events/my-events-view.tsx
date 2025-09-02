"use client";

import { useState, useEffect } from "react";
import { useClientAuth } from "@/components/client-auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  Edit3,
  Eye,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getEventsByHost, getEventAttendees } from "@/lib/data/events";
import type { Event, EventAttendee } from "@/types/event";

export function MyEventsView() {
  const { user, isLoading: authLoading } = useClientAuth();
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [attendeeData, setAttendeeData] = useState<
    Record<string, EventAttendee[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!user || authLoading) return;

      try {
        setLoading(true);
        const events = await getEventsByHost(user.id);
        setUserEvents(events);

        // Fetch attendee data for each event
        const attendeePromises = events.map(async (event) => {
          const attendees = await getEventAttendees(event.id);
          return { eventId: event.id, attendees };
        });

        const attendeeResults = await Promise.all(attendeePromises);
        const attendeeMap: Record<string, EventAttendee[]> = {};
        attendeeResults.forEach(({ eventId, attendees }) => {
          attendeeMap[eventId] = attendees;
        });
        setAttendeeData(attendeeMap);
      } catch (error) {
        console.error("Error fetching user events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [user, authLoading]);

  // Handle image error
  const handleImageError = (eventId: string) => {
    setFailedImages((prev) => new Set(prev).add(eventId));
  };

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

  // Helper function to get event attendees count
  const getAttendeeCount = (eventId: string) => {
    const attendees = attendeeData[eventId] || [];
    return attendees.filter(
      (a) => a.status === "going" || a.status === "approved"
    ).length;
  };

  // Helper function to get interested count
  const getInterestedCount = (eventId: string) => {
    const attendees = attendeeData[eventId] || [];
    return attendees.filter((a) => a.status === "interested").length;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to view your events.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">My Events</h1>
            <p className="text-muted-foreground">Loading your events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              My Events
            </h1>
            <p className="text-muted-foreground">
              Manage and view all your hosted events
            </p>
          </div>
          <Link href="/events/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>

        {/* Events Grid */}
        {userEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userEvents.map((event) => {
              const dateInfo = formatDate(event.daily_schedule);
              const attendeeCount = getAttendeeCount(event.id);
              const interestedCount = getInterestedCount(event.id);

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
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
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
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Date and Time */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          <Calendar className="h-5 w-5 text-primary" />
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

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {interestedCount} interested
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {attendeeCount} attending
                          </span>
                        </div>
                      </div>

                      <Separator />

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/events/${event.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          className="w-full flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/events/edit/${event.id}`;
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No events created yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Start by creating your first car event or meet.
            </p>
            <Link href="/events/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Event
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
