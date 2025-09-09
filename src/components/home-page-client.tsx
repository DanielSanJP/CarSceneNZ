"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Car as CarIcon, Users, Trophy, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import type { Car } from "@/types/car";
import type { Event } from "@/types/event";
import type { User } from "@/types/user";

interface HomePageClientProps {
  events: Event[];
  cars: Car[];
  users: User[];
}

export function HomePageClient({ events, cars, users }: HomePageClientProps) {
  // Create users map for quick lookups
  const usersMap = useMemo(() => {
    const map: Record<string, User> = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  // Process upcoming events
  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (!event.daily_schedule || event.daily_schedule.length === 0)
          return false;
        return new Date(event.daily_schedule[0].date) > new Date();
      })
      .sort((a, b) => {
        if (!a.daily_schedule?.[0] || !b.daily_schedule?.[0]) return 0;
        return (
          new Date(a.daily_schedule[0].date).getTime() -
          new Date(b.daily_schedule[0].date).getTime()
        );
      })
      .slice(0, 3);
  }, [events]);

  // Process featured cars (sort by total_likes)
  const featuredCars = useMemo(() => {
    return cars
      .sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0))
      .slice(0, 3);
  }, [cars]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
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
      </section>

      {/* Top Upcoming Events Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Upcoming Events
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Do not miss these upcoming car meets and gatherings.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: Event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <Card className="overflow-hidden pt-0 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-square overflow-hidden">
                    {event.poster_image_url ? (
                      <Image
                        src={event.poster_image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
      </section>

      {/* Featured Cars Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Featured Cars
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Check out the most popular rides in the community.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {featuredCars.length > 0 ? (
            featuredCars.map((car) => (
              <Link key={car.id} href={`/garage/${car.id}`}>
                <Card className="overflow-hidden pt-0 text-center hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative aspect-square overflow-hidden">
                    {car.images?.[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                      {usersMap[car.owner_id]?.display_name ||
                        usersMap[car.owner_id]?.username ||
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

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From finding the next car meet to showcasing your build, Car Scene
            NZ has all the tools to connect with the community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Find Events</CardTitle>
              <CardDescription>
                Discover car meets and events happening across New Zealand
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CarIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Showcase Cars</CardTitle>
              <CardDescription>
                Build your virtual garage and show off your rides to the
                community
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Join Clubs</CardTitle>
              <CardDescription>
                Connect with like-minded enthusiasts and build lasting
                friendships
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Compete</CardTitle>
              <CardDescription>
                Participate in leaderboards and showcase the best builds in NZ
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className=" border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <CarIcon className="h-6 w-6" />
              <span className="font-semibold">Car Scene NZ</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Car Scene NZ. Connecting the car community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
