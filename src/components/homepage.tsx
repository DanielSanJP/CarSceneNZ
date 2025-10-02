"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Car as CarIcon, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/types/event";
import type { Car } from "@/types/car";
import type { User } from "@/types/user";

// Extended types for home page data - moved from use-home.ts
export interface HomeEvent extends Event {
  host?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  attendeeCount?: number;
  interestedCount?: number;
}

export interface HomeCar extends Car {
  owner?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export interface HomeClub {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  leader_id: string;
  leader?: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
  member_count?: number;
}

export interface HomeUser extends User {
  car_count?: number;
  followers_count?: number;
}

export interface HomeData {
  events: HomeEvent[];
  cars: HomeCar[];
  clubs: HomeClub[];
  users: HomeUser[];
  stats: {
    total_events: number;
    total_cars: number;
    total_clubs: number;
    total_users: number;
  };
  meta: {
    generated_at: string;
    cache_key: string;
  };
}

export interface ProcessedHomeData extends HomeData {
  upcomingEvents: HomeEvent[];
  featuredCars: HomeCar[];
  usersMap: Record<string, HomeUser>;
}

interface HomepageProps {
  homeData: ProcessedHomeData | null;
}

export function Homepage({ homeData }: HomepageProps) {
  // Helper function to format date with ordinal suffix
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const weekday = date.toLocaleDateString("en-NZ", { weekday: "long" });
    const month = date.toLocaleDateString("en-NZ", { month: "long" });

    // Add ordinal suffix
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    return `${weekday} ${day}${getOrdinalSuffix(day)} ${month}`;
  };

  // No data state
  if (!homeData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Failed to load home page data. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract data from props
  const { upcomingEvents, featuredCars, usersMap } = homeData;

  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <Badge variant="secondary" className="mb-4">
          Connecting NZ Car Enthusiasts
        </Badge>
        <h2 className="text-4xl md:text-6xl font-bold text-foreground">
          Strengthen the Car
          <br />
          <span className="text-primary">Community</span> in NZ
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover car meets, showcase your ride, join clubs, and connect with
          fellow car enthusiasts across New Zealand.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/events">
            <Button size="lg" className="text-lg px-8">
              Explore Events
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Join Community
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Upcoming Events Section */}

      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold text-foreground mb-4">
          Upcoming Events
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Do not miss these upcoming car meets and gatherings.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {upcomingEvents && upcomingEvents.length > 0 ? (
          upcomingEvents.map((event: Event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="overflow-hidden pt-0 text-center hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                <div className="relative aspect-square overflow-hidden">
                  {event.poster_image_url ? (
                    <Image
                      src={event.poster_image_url}
                      alt={event.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false} // Performance: Don't prioritize homepage images
                    />
                  ) : (
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {event.daily_schedule && event.daily_schedule.length > 0
                      ? formatEventDate(event.daily_schedule[0].date)
                      : "Date TBD"}{" "}
                    - {event.location}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">
                    {event.description
                      ? event.description.slice(0, 100) + "..."
                      : "No description available"}
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-muted-foreground mb-2">
              No upcoming events
            </h4>
            <p className="text-muted-foreground">
              Be the first to create an event for the community!
            </p>
            <Link href="/events/create">
              <Button className="mt-4">Create Event</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Featured Cars Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Featured Cars
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Check out the most popular rides in the community.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {featuredCars && featuredCars.length > 0 ? (
            featuredCars.map((car: HomeCar) => (
              <Link key={car.id} href={`/garage/${car.id}`}>
                <Card className="overflow-hidden pt-0 text-center hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                  <div className="relative aspect-square overflow-hidden">
                    {car.images?.[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={false} // Performance: Don't prioritize homepage images
                      />
                    ) : (
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <CarIcon className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>
                      {car.year} {car.brand} {car.model}
                    </CardTitle>
                    <CardDescription>
                      Owned by{" "}
                      {(usersMap && usersMap[car.owner_id]?.display_name) ||
                        (usersMap && usersMap[car.owner_id]?.username) ||
                        "Unknown User"}
                    </CardDescription>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 fill-yellow-500" />
                      <p className="text-sm text-muted-foreground">
                        {car.total_likes || 0} likes
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <CarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-muted-foreground mb-2">
                No cars to feature yet
              </h4>
              <p className="text-muted-foreground">
                Share your ride and be the first featured car!
              </p>
              <Link href="/garage/create">
                <Button className="mt-4">Add Your Car</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
