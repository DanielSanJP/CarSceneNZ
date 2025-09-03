"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Event, EventAttendee } from "@/types/event";

interface MyEventsViewProps {
  events: Event[];
}

export function MyEventsView({ events }: MyEventsViewProps) {
  const [attendeeData] = useState<Record<string, EventAttendee[]>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Since we can't call server functions from client components,
  // we'll need to create an API route for getting attendees if needed
  // For now, we'll just display the events without attendee counts

  const handleImageError = (eventId: string) => {
    setFailedImages((prev) => new Set(prev).add(eventId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
              <p className="text-muted-foreground">
                Events you&apos;ve created and are hosting
              </p>
            </div>
            <Link href="/events/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>

          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start organizing your first event for the community
                </p>
                <Link href="/events/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card
                  key={event.id}
                  className="group overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-0">
                    <div className="aspect-video relative overflow-hidden">
                      {event.poster_image_url && !failedImages.has(event.id) ? (
                        <Image
                          src={event.poster_image_url}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => handleImageError(event.id)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-blue-400" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <div className="flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-sm">
                          <Users className="h-3 w-3" />
                          <span>{attendeeData[event.id]?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {event.title}
                      </h3>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {event.daily_schedule[0]?.date
                              ? formatDate(event.daily_schedule[0].date)
                              : "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {event.daily_schedule[0]?.start_time
                              ? formatTime(event.daily_schedule[0].start_time)
                              : "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Link href={`/events/${event.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/events/edit/${event.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
