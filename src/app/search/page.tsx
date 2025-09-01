"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Navigation } from "@/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Car, Calendar, Trophy, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  getAllCars,
  getAllUsers,
  getAllEvents,
  getAllClubs,
  type Car as CarType,
  type User,
  type Event,
  type Club,
} from "@/data";

function SearchFallback() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading search...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    cars: CarType[];
    users: User[];
    events: Event[];
    clubs: Club[];
  }>({
    cars: [],
    users: [],
    events: [],
    clubs: [],
  });
  const [results, setResults] = useState<{
    cars: CarType[];
    users: User[];
    events: Event[];
    clubs: Club[];
  }>({
    cars: [],
    users: [],
    events: [],
    clubs: [],
  });

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [carsData, usersData, eventsData, clubsData] = await Promise.all([
          getAllCars(),
          getAllUsers(),
          getAllEvents(),
          getAllClubs(),
        ]);
        setData({
          cars: carsData,
          users: usersData,
          events: eventsData,
          clubs: clubsData,
        });
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading search data:", error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults({ cars: [], users: [], events: [], clubs: [] });
        return;
      }

      const searchTerm = searchQuery.toLowerCase();

      // Search cars
      const carResults = data.cars.filter(
        (car) =>
          car.brand.toLowerCase().includes(searchTerm) ||
          car.model.toLowerCase().includes(searchTerm) ||
          car.year.toString().includes(searchTerm)
      );

      // Search users
      const userResults = data.users.filter(
        (user) =>
          user.display_name.toLowerCase().includes(searchTerm) ||
          user.username.toLowerCase().includes(searchTerm)
      );

      // Search events
      const eventResults = data.events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm) ||
          (event.location &&
            event.location.toLowerCase().includes(searchTerm)) ||
          (event.description &&
            event.description.toLowerCase().includes(searchTerm))
      );

      // Search clubs
      const clubResults = data.clubs.filter(
        (club) =>
          club.name.toLowerCase().includes(searchTerm) ||
          (club.description &&
            club.description.toLowerCase().includes(searchTerm))
      );

      setResults({
        cars: carResults,
        users: userResults,
        events: eventResults,
        clubs: clubResults,
      });
    },
    [data]
  );

  useEffect(() => {
    if (!isLoading) {
      performSearch(query);
    }
  }, [query, isLoading, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const totalResults =
    results.cars.length +
    results.users.length +
    results.events.length +
    results.clubs.length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Search</h1>
            <form
              onSubmit={handleSearch}
              className="flex gap-2 max-w-2xl mx-auto"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cars, users, events, or clubs..."
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading search data...</p>
            </div>
          ) : (
            <>
              {query && (
                <div className="text-center mb-6">
                  <p className="text-muted-foreground">
                    {totalResults} results for &quot;{query}&quot;
                  </p>
                </div>
              )}

              <div className="space-y-8">
                {/* Cars Results */}
                {results.cars.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Cars ({results.cars.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {results.cars.map((car) => (
                        <Link key={car.id} href={`/garage/${car.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden pt-0">
                            <div className="relative aspect-[4/3] w-full">
                              {car.images && car.images.length > 0 ? (
                                <Image
                                  src={car.images[0]}
                                  alt={`${car.brand} ${car.model}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML =
                                        '<div class="w-full h-full bg-muted flex items-center justify-center"><svg class="h-12 w-12 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V9a1 1 0 00-1-1H1a1 1 0 010-2h1a3 3 0 013 3v8a2 2 0 002 2h11a1 1 0 010 2H7z"/><path d="M20.38 8.04A1 1 0 0019 7H5a3 3 0 00-3 3v7a3 3 0 003 3h14a3 3 0 003-3v-7a3 3 0 00-.62-1.96zM12 16.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg></div>';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <Car className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4 pt-0">
                              <div>
                                <h3 className="font-semibold">
                                  {car.year} {car.brand} {car.model}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Owner:{" "}
                                  {data.users.find((u) => u.id === car.owner_id)
                                    ?.display_name || "Unknown"}
                                </p>

                                <Badge variant="outline" className="mt-1">
                                  {car.year}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Results */}
                {results.users.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Users ({results.users.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {results.users.map((user) => (
                        <Link key={user.id} href={`/profile/${user.username}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage
                                    src={user.profile_image_url}
                                    alt={user.display_name}
                                  />
                                  <AvatarFallback>
                                    {user.display_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold">
                                    {user.display_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    @{user.username}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Events Results */}
                {results.events.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Events ({results.events.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {results.events.map((event) => (
                        <Link key={event.id} href={`/events?event=${event.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer pt-2">
                            <CardContent className="p-4">
                              <div>
                                <h3 className="font-semibold">{event.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.location}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.daily_schedule &&
                                  event.daily_schedule.length > 0
                                    ? new Date(
                                        event.daily_schedule[0].date
                                      ).toLocaleDateString()
                                    : new Date(
                                        event.created_at
                                      ).toLocaleDateString()}
                                </p>
                                <p className="text-sm mt-2 line-clamp-2">
                                  {event.description}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clubs Results */}
                {results.clubs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      Clubs ({results.clubs.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {results.clubs.map((club) => (
                        <Link key={club.id} href={`/clubs?club=${club.id}`}>
                          <Card className="hover:shadow-md transition-shadow cursor-pointer py-2">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage
                                    src={club.banner_image_url}
                                    alt={club.name}
                                  />
                                  <AvatarFallback>
                                    {club.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-semibold">{club.name}</h3>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {club.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {query && totalResults === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground">
                      Try searching with different keywords or check your
                      spelling.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
