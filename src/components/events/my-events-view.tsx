"use client";

import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Users,
  Edit3,
  Eye,
  ImageIcon,
  Star,
} from "lucide-react";
import { EventDateDisplay } from "./event-date-display";
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/types/event";

// Pure SSR data structure - no React Query
interface MyEventsViewProps {
  events: Event[]; // Direct SSR data
  userId: string;
}

function MyEventsViewComponent({ events: userEvents }: MyEventsViewProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleImageError = (eventId: string) => {
    setFailedImages((prev) => new Set(prev).add(eventId));
  };

  // Pure SSR - no loading or error states needed (handled by page-level loading.tsx/error.tsx)

  const getAttendeeCount = (event: Event & { attendeeCount?: number }) => {
    return event.attendeeCount || 0;
  };

  const getInterestedCount = (event: Event & { interestedCount?: number }) => {
    return event.interestedCount || 0;
  };

  return (
    <>
      {/* Events Grid */}
      {userEvents.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {userEvents.map((event) => {
            const attendeeCount = getAttendeeCount(event);
            const interestedCount = getInterestedCount(event);

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block"
              >
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
                    <EventDateDisplay
                      dailySchedule={event.daily_schedule || []}
                    />

                    <Separator />

                    {/* Location */}
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {event.location}
                      </span>
                    </div>

                    <Separator />

                    {/* Stats */}
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

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/events/${event.id}`);
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
                          router.push(
                            `/events/edit/${event.id}?from=my-events`
                          );
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
        </div>
      )}
    </>
  );
}

// Export memoized component for performance
export const MyEventsView = memo(MyEventsViewComponent);
