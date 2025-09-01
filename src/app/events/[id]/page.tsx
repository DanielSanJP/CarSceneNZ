"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  Star,
  ImageIcon,
  Share2,
  Heart,
} from "lucide-react";
import { getEventById, getEventAttendees, getUserById } from "@/data";
import Image from "next/image";
import Link from "next/link";
import type { Event, EventAttendee } from "@/types/event";
import type { User } from "@/types/user";

export default function EventDetailPage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [host, setHost] = useState<User | null>(null);
  const [failedImage, setFailedImage] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // Get event details
        const eventData = await getEventById(eventId);
        if (!eventData) {
          return;
        }
        setEvent(eventData);

        // Get event attendees
        const attendeesData = await getEventAttendees(eventId);
        setAttendees(attendeesData);

        // Get host details if not already included
        if (eventData.host_id && !eventData.host) {
          const hostData = await getUserById(eventData.host_id);
          setHost(hostData);
        } else if (eventData.host) {
          // Convert the partial host object to a full User object or handle it properly
          setHost(eventData.host as User);
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  // Get attendee counts
  const goingCount = attendees.filter(
    (a) => a.status === "going" || a.status === "approved"
  ).length;
  const interestedCount = attendees.filter(
    (a) => a.status === "interested"
  ).length;

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/events");
    }
  };

  const handleImageError = () => {
    setFailedImage(true);
  };

  const handleStatusChange = (status: string) => {
    setUserStatus(status);
    // Here you would typically update the backend
    console.log(
      `User ${currentUser?.id} set status to ${status} for event ${eventId}`
    );
  };

  const handleShare = async () => {
    if (!event) return;

    const shareUrl = `${window.location.origin}/events/${eventId}`;
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title} - ${
        event.description ? event.description.substring(0, 100) : ""
      }${event.description && event.description.length > 100 ? "..." : ""}`,
      url: shareUrl,
    };

    try {
      // Check if Web Share API is supported (mainly mobile devices)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(shareUrl);
        // You could add a toast notification here to inform the user
        alert("Event link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Final fallback - just copy URL
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Event link copied to clipboard!");
      } catch (clipboardError) {
        console.error("Clipboard access failed:", clipboardError);
        // Last resort - show the URL
        prompt("Copy this link to share the event:", shareUrl);
      }
    }
  };

  // Get host info is handled in useEffect above

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The event you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={handleBackClick} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to format date for daily schedule
  const getEventDateInfo = (
    schedule: Array<{ date: string; start_time?: string; end_time?: string }>
  ) => {
    if (!schedule || schedule.length === 0) return { full: "", time: "" };

    const dates = schedule.map((s) => new Date(s.date));
    const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const isMultiDay = startDate.getTime() !== endDate.getTime();

    // Format full date display
    let fullDisplay = startDate.toLocaleDateString("en-NZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (isMultiDay) {
      const endDateFull = endDate.toLocaleDateString("en-NZ", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      fullDisplay = `${fullDisplay} - ${endDateFull}`;
    }

    // Format time display
    const time = schedule
      .map((s) => {
        if (s.start_time && s.end_time) {
          return `${s.start_time} - ${s.end_time}`;
        } else if (s.start_time) {
          return `Starts at ${s.start_time}`;
        } else {
          return "All day";
        }
      })
      .join(", ");

    return {
      full: fullDisplay,
      time: time,
    };
  };

  const dateInfo = getEventDateInfo(event.daily_schedule || []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={handleBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                {host && (
                  <span className="text-muted-foreground text-sm">
                    {event.location}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Image */}
              <Card className="py-0">
                <CardContent className="p-0">
                  <div className="relative w-full overflow-hidden rounded-lg flex items-center justify-center">
                    {failedImage || !event.poster_image_url ? (
                      <div className="w-full min-h-[300px] flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-16 w-16 text-primary mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground font-medium">
                            {event.title}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={event.poster_image_url}
                        alt={event.title}
                        width={800}
                        height={600}
                        className="object-contain w-full h-auto max-h-[600px]"
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        quality={100}
                        priority
                        onError={handleImageError}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Host */}
                  {host && (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={host.profile_image_url}
                          alt={host.username}
                        />
                        <AvatarFallback>
                          {host.username
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Event by
                        </div>
                        <Link href={`/profile/${host.username}`}>
                          <div className="text-sm font-medium hover:underline">
                            {host.display_name}
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Location */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Location</div>
                      <div className="text-muted-foreground text-sm">
                        {event.location}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Date and Time */}
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{dateInfo.full}</div>
                      <div className="text-muted-foreground text-sm flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {dateInfo.time}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Description */}
                  <div>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Daily Schedule */}
                  {event.daily_schedule && event.daily_schedule.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Event Schedule
                        </h4>
                        <div className="space-y-4">
                          {event.daily_schedule.map((schedule, index) => {
                            const date = new Date(schedule.date);
                            const dayName = date.toLocaleDateString("en-NZ", {
                              weekday: "long",
                            });
                            const dateFormatted = date.toLocaleDateString(
                              "en-NZ",
                              {
                                day: "numeric",
                                month: "long",
                              }
                            );

                            return (
                              <div
                                key={index}
                                className="border rounded-lg p-4 bg-muted/30"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                                      <Calendar className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-semibold text-sm">
                                        {event.daily_schedule &&
                                        event.daily_schedule.length > 1
                                          ? `Day ${index + 1} - ${dayName}`
                                          : dayName}
                                      </div>
                                      <div className="text-muted-foreground text-sm">
                                        {dateFormatted}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {schedule.start_time} - {schedule.end_time}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action Buttons */}
              <Card>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange("going")}
                    variant={userStatus === "going" ? "default" : "outline"}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    I&apos;m Going
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => handleStatusChange("interested")}
                    variant={
                      userStatus === "interested" ? "default" : "outline"
                    }
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Interested
                  </Button>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Event Location Map */}
              <Card className="py-0">
                <CardContent className="p-0">
                  <div className="aspect-square w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://maps.google.com/maps?width=100%25&height=400&hl=en&q=${encodeURIComponent(
                        event.location + ", New Zealand"
                      )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      title={`Map showing ${event.location}`}
                    />
                  </div>
                  <div className="p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-foreground">
                        {event.location}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const query = encodeURIComponent(
                            event.location + ", New Zealand"
                          );
                          window.open(
                            `https://maps.google.com/maps?q=${query}`,
                            "_blank"
                          );
                        }}
                      >
                        Open in Maps
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Going</span>
                    <Badge variant="secondary">{goingCount}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Interested
                    </span>
                    <Badge variant="secondary">{interestedCount}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
