"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit3,
  Eye,
  ImageIcon,
  Star,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/types/event";

interface MyEventsViewProps {
  events: Event[];
  attendeeCounts?: Record<
    string,
    { interested: number; going: number; total: number }
  >;
}

export function MyEventsView({ events, attendeeCounts }: MyEventsViewProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const userEvents = events;

  const getAttendeeCount = (eventId: string) => {
    return attendeeCounts?.[eventId]?.going || 0;
  };

  const getInterestedCount = (eventId: string) => {
    return attendeeCounts?.[eventId]?.interested || 0;
  };

  const handleImageError = (eventId: string) => {
    setFailedImages((prev) => new Set(prev).add(eventId));
  };

  const formatDate = (
    dailySchedule: Array<{
      date: string;
      start_time?: string;
      end_time?: string;
    }>
  ) => {
    if (!dailySchedule || dailySchedule.length === 0) {
      return { full: "TBD", time: "TBD" };
    }

    const schedule = dailySchedule[0];
    const date = schedule?.date ? new Date(schedule.date) : null;
    const time = schedule?.start_time;

    return {
      full: date
        ? date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "TBD",
      time: time
        ? new Date(`1970-01-01T${time}`).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "TBD",
    };
  };

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
                          variant="outline"
                          size="sm"
                          className="w-full flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/events/edit/${event.id}?from=my-events`;
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
