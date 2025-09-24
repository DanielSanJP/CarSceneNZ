"use client";

import { useState, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  UserCheck,
  ImageIcon,
  Star,
  Users,
} from "lucide-react";
import { EventDateDisplay } from "./event-date-display";
import type { Event } from "@/types/event";

interface AttendingEventsViewProps {
  events: Event[];
  eventType: "going" | "interested";
}

function AttendingEventsViewComponent({
  events,
  eventType,
}: AttendingEventsViewProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (eventId: string) => {
    setFailedImages((prev) => new Set(prev).add(eventId));
  };

  const getAttendeeCount = (event: Event & { attendeeCount?: number }) => {
    return event.attendeeCount || 0;
  };

  const getInterestedCount = (event: Event & { interestedCount?: number }) => {
    return event.interestedCount || 0;
  };

  const getEventIcon = () => {
    return eventType === "going" ? (
      <UserCheck className="h-5 w-5 text-green-600" />
    ) : (
      <Star className="h-5 w-5 text-yellow-600" />
    );
  };

  const getEventStatusText = () => {
    return eventType === "going" ? "Going" : "Interested";
  };

  const getEmptyStateContent = () => {
    if (eventType === "going") {
      return {
        title: "No events you're attending yet",
        description:
          "Start exploring events and mark yourself as going to see them here.",
        icon: (
          <UserCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        ),
      };
    } else {
      return {
        title: "No events you're interested in yet",
        description:
          "Start exploring events and mark yourself as interested to see them here.",
        icon: <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4" />,
      };
    }
  };

  if (events.length === 0) {
    const emptyState = getEmptyStateContent();
    return (
      <div className="text-center py-12">
        {emptyState.icon}
        <h3 className="text-lg font-medium text-foreground mb-2">
          {emptyState.title}
        </h3>
        <p className="text-muted-foreground mb-6">{emptyState.description}</p>
        <Link href="/events">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Browse Events
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const attendeeCount = getAttendeeCount(event);
        const interestedCount = getInterestedCount(event);

        return (
          <Link key={event.id} href={`/events/${event.id}`} className="block">
            <Card className="overflow-hidden pt-0 cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col">
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
                    quality={75}
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    onError={() => handleImageError(event.id)}
                  />
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <div className="bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium">
                    {getEventIcon()}
                    {getEventStatusText()}
                  </div>
                </div>
              </div>

              <CardHeader className="pb-3 h-24 flex-shrink-0">
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 flex flex-col">
                    <CardTitle className="text-lg mb-2 line-clamp-1">
                      {event.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      {event.description}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 flex-1 flex flex-col">
                {/* Date and Time */}
                <EventDateDisplay dailySchedule={event.daily_schedule || []} />

                <Separator />

                {/* Location */}
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {event.location}
                  </span>
                </div>

                <Separator />

                {/* Attendance info */}
                <div className="flex items-center justify-evenly text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{interestedCount} interested</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{attendeeCount} going</span>
                  </div>
                </div>

                <Separator />

                {/* Host Information */}
                <div className="flex items-center gap-2 text-sm">
                  {event.host?.profile_image_url ? (
                    <Image
                      src={event.host.profile_image_url}
                      alt={
                        event.host.display_name || event.host.username || "Host"
                      }
                      width={32}
                      height={32}
                      quality={100}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {(
                          event.host?.display_name ||
                          event.host?.username ||
                          "?"
                        )
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Hosted by
                    </div>
                    <div className="text-sm font-medium">
                      {event.host?.display_name ||
                        event.host?.username ||
                        "Unknown Host"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// Export memoized component for performance
export const AttendingEventsView = memo(AttendingEventsViewComponent);
