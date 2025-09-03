"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { ArrowLeft, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Event } from "@/types/event";

interface EventDetailViewProps {
  event: Event;
  user?: {
    id: string;
    username: string;
    display_name?: string;
  } | null;
}

export function EventDetailView({ event, user }: EventDetailViewProps) {
  const router = useRouter();
  const [failedImage, setFailedImage] = useState(false);

  // Mock attendance counts for display
  const attendeeCount = 15;
  const interestedCount = 8;

  const getHostInfo = () => {
    if (event.host) {
      return {
        name: event.host.display_name || event.host.username || "Unknown Host",
        username: event.host.username || "unknown",
      };
    }
    return {
      name: "Unknown Host",
      username: "unknown",
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleAttendanceAction = (status: string) => {
    if (!user) {
      router.push("/register");
      return;
    }
    // Placeholder for attendance functionality
    console.log(`Attendance action: ${status}`);
  };

  const hostInfo = getHostInfo();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{event.title}</h1>
          <p className="text-muted-foreground">Event Details</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Image */}
          {event.poster_image_url && !failedImage && (
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={event.poster_image_url}
                    alt={event.title}
                    fill
                    className="object-cover"
                    onError={() => setFailedImage(true)}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Event Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Event Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.daily_schedule.map((schedule, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">
                      {formatDate(schedule.date)}
                    </div>
                    {(schedule.start_time || schedule.end_time) && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {schedule.start_time && formatTime(schedule.start_time)}
                        {schedule.start_time && schedule.end_time && " - "}
                        {schedule.end_time && formatTime(schedule.end_time)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Host Information */}
          <Card>
            <CardHeader>
              <CardTitle>Hosted by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {hostInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">{hostInfo.name}</div>
                  <div className="text-sm text-muted-foreground">
                    @{hostInfo.username}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.location && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">
                      {event.location}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Attendance</div>
                  <div className="text-sm text-muted-foreground">
                    {attendeeCount} going • {interestedCount} interested
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Actions */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle>Are you going?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleAttendanceAction("interested")}
                >
                  Interested
                </Button>
                <Button
                  className="w-full"
                  onClick={() => handleAttendanceAction("going")}
                >
                  I&apos;m Going
                </Button>
              </CardContent>
            </Card>
          )}

          {!user && (
            <Card>
              <CardHeader>
                <CardTitle>Join the event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign up to RSVP and connect with other attendees.
                </p>
                <Button
                  className="w-full"
                  onClick={() => router.push("/register")}
                >
                  Sign Up
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
