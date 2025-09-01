"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/nav";
import { Calendar, Car as CarIcon, Users, Trophy, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { getAllCars, getAllEvents, getAllClubs, getAllUsers } from "@/lib/data";
import type { Car, Event, User } from "@/types";

export default function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [stats, setStats] = useState({
    users: 0,
    cars: 0,
    events: 0,
    clubs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, carsData, clubsData, usersData] = await Promise.all([
          getAllEvents(),
          getAllCars(),
          getAllClubs(),
          getAllUsers(),
        ]);

        // Create users map for quick lookups
        const usersMapData: Record<string, User> = {};
        usersData.forEach((user) => {
          usersMapData[user.id] = user;
        });
        setUsersMap(usersMapData);

        // Process upcoming events
        const upcoming = eventsData
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

        setUpcomingEvents(upcoming);

        // Process featured cars (sort by total_likes)
        const featured = carsData
          .sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0))
          .slice(0, 3);

        setFeaturedCars(featured);

        // Set stats
        setStats({
          users: usersData.length,
          cars: carsData.length,
          events: eventsData.length,
          clubs: clubsData.length,
        });
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // Helper function to get car image
  const getCarImage = (car: Car) => {
    if (car.brand === "Subaru" && car.model === "Forester") {
      return "/cars/Forester1.jpg";
    }
    // Add more mappings as needed
    return "/cars/Forester1.jpg"; // Default image
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <CarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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
          {upcomingEvents.map((event: Event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="text-center pt-0 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={event.poster_image_url || "/events/default-event.jpg"}
                    alt={event.title}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
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
          ))}
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
          {featuredCars.map((car) => (
            <Link key={car.id} href={`/garage/${car.id}`}>
              <Card className="text-center pt-0 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <Image
                    src={getCarImage(car)}
                    alt={`${car.brand} ${car.model}`}
                    width={400}
                    height={225}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle>
                    {car.year} {car.brand} {car.model}
                  </CardTitle>
                  <CardDescription>
                    Owned by {usersMap[car.owner_id]?.display_name || "Unknown"}
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
          ))}
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Community Stats
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join a growing community of car enthusiasts across New Zealand.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>{stats.users}</CardTitle>
              <CardDescription>Members</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <CarIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>{stats.cars}</CardTitle>
              <CardDescription>Cars</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>{stats.events}</CardTitle>
              <CardDescription>Events</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>{stats.clubs}</CardTitle>
              <CardDescription>Clubs</CardDescription>
            </CardHeader>
          </Card>
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
