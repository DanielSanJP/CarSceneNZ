"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { getEventsByHost } from "@/lib/data/events";
import type { Event } from "@/types/event";

export function MyEventsView() {
  const { user, isAuthenticated } = useAuth();
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUserEvents = async () => {
      if (!user) return;

      try {
        const events = await getEventsByHost(user.id);
        setUserEvents(events);
      } catch (error) {
        console.error("Error fetching user events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [user]);

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

  // Helper function to get event attendees count (mock data for now)
  const getAttendeeCount = () => {
    return Math.floor(Math.random() * 40) + 10;
  };

  // Helper function to get interested count (mock data for now)
  const getInterestedCount = () => {
    return Math.floor(Math.random() * 15) + 5;
  };

  // Get event status based on dates
  const getEventStatus = (schedule: unknown) => {
    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      return { status: "draft", color: "secondary" };
    }

    const firstDay = (schedule as { date: string; start_time?: string }[])[0];
    const eventDate = new Date(firstDay.date);
    const now = new Date();

    if (eventDate < now) {
      return { status: "completed", color: "outline" };
    } else if (eventDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return { status: "upcoming", color: "default" };
    } else {
      return { status: "planned", color: "secondary" };
    }
  };

  if (!isAuthenticated || !user) {
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{userEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {
                      userEvents.filter(
                        (e) =>
                          getEventStatus(e.daily_schedule).status === "upcoming"
                      ).length
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {userEvents.reduce((acc) => acc + getAttendeeCount(), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Attendees
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {userEvents.reduce((acc) => acc + getInterestedCount(), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Interested
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events Grid */}
        {userEvents.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userEvents.map((event) => {
              const dateInfo = formatDate(event.daily_schedule);
              const attendeeCount = getAttendeeCount();
              const interestedCount = getInterestedCount();
              const eventStatus = getEventStatus(event.daily_schedule);

              return (
                <Card key={event.id} className="overflow-hidden pt-0">
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

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        variant={
                          eventStatus.color as
                            | "default"
                            | "secondary"
                            | "outline"
                        }
                      >
                        {eventStatus.status}
                      </Badge>
                    </div>
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
                      <Link href={`/events/${event.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Link
                        href={`/events/edit/${event.id}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
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
