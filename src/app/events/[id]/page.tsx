"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
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
import { events, eventAttendees, getUserById } from "@/data";
import Image from "next/image";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  host_id: string;
  is_public: boolean;
  poster_image_url: string;
  created_at: string;
}

interface EventAttendee {
  event_id: string;
  user_id: string;
  status:
    | "going"
    | "interested"
    | "maybe"
    | "not_going"
    | "approved"
    | "pending";
  created_at: string;
}

export default function EventDetailPage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [failedImage, setFailedImage] = useState(false);
  const [userStatus, setUserStatus] = useState<string | null>(null);

  // Find the event
  const event = (events as Event[]).find((e) => e.id === eventId);

  // Get event attendees
  const attendees = (eventAttendees as EventAttendee[]).filter(
    (attendee) => attendee.event_id === eventId
  );

  // Get attendee counts
  const goingCount = attendees.filter(
    (a) => a.status === "going" || a.status === "approved"
  ).length;
  const interestedCount = attendees.filter(
    (a) => a.status === "interested"
  ).length;

  // Get attendee users
  const goingUsers = attendees
    .filter((a) => a.status === "going" || a.status === "approved")
    .map((a) => getUserById(a.user_id))
    .filter((user): user is NonNullable<typeof user> => user !== null);

  const interestedUsers = attendees
    .filter((a) => a.status === "interested")
    .map((a) => getUserById(a.user_id))
    .filter((user): user is NonNullable<typeof user> => user !== null);

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
      text: `Check out this event: ${
        event.title
      } - ${event.description.substring(0, 100)}${
        event.description.length > 100 ? "..." : ""
      }`,
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

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      full: date.toLocaleDateString("en-NZ", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-NZ", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      day: date.toLocaleDateString("en-NZ", { weekday: "short" }),
      date: date.toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "short",
      }),
    };
  };

  // Get host info
  const host = event ? getUserById(event.host_id) : null;

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

  const dateInfo = formatDate(event.event_date);

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
                <Badge variant={event.is_public ? "default" : "secondary"}>
                  {event.is_public ? "Public Event" : "Private Event"}
                </Badge>
                {host && (
                  <span className="text-muted-foreground text-sm">
                    Hosted by {host.display_name}
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
                    {failedImage ? (
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
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description}
                  </p>
                </CardContent>
              </Card>

              {/* Attendees Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Who&apos;s Coming</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Going */}
                  {goingUsers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Going ({goingCount})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {goingUsers.slice(0, 8).map((user) => (
                          <Link
                            key={user.id}
                            href={`/profile/${user.username}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={user.profile_image_url}
                                alt={user.display_name}
                              />
                              <AvatarFallback className="text-xs">
                                {user.display_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate">
                              {user.display_name}
                            </span>
                          </Link>
                        ))}
                      </div>
                      {goingUsers.length > 8 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          And {goingUsers.length - 8} more...
                        </p>
                      )}
                    </div>
                  )}

                  {/* Interested */}
                  {interestedUsers.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Interested ({interestedCount})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {interestedUsers.slice(0, 8).map((user) => (
                          <Link
                            key={user.id}
                            href={`/profile/${user.username}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={user.profile_image_url}
                                alt={user.display_name}
                              />
                              <AvatarFallback className="text-xs">
                                {user.display_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate">
                              {user.display_name}
                            </span>
                          </Link>
                        ))}
                      </div>
                      {interestedUsers.length > 8 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          And {interestedUsers.length - 8} more...
                        </p>
                      )}
                    </div>
                  )}

                  {goingUsers.length === 0 && interestedUsers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Be the first to show interest in this event!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  {/* Host */}
                  {host && (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={host.profile_image_url}
                          alt={host.display_name}
                        />
                        <AvatarFallback>
                          {host.display_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Hosted by
                        </div>
                        <Link href={`/profile/${host.username}`}>
                          <div className="text-sm font-medium hover:underline">
                            {host.display_name}
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardHeader>
                  <CardTitle>Join This Event</CardTitle>
                </CardHeader>
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Interest
                    </span>
                    <Badge variant="secondary">
                      {goingCount + interestedCount}
                    </Badge>
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
