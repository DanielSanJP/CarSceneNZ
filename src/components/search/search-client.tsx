"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Car, Calendar, Trophy, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { type Car as CarType, type User, type Event, type Club } from "@/types";

interface SearchClientProps {
  initialData: {
    cars: CarType[];
    users: User[];
    events: Event[];
    clubs: Club[];
  } | null;
}

function SearchFallback() {
  return (
    <>
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading search...</p>
        </div>
      </div>
    </>
  );
}

function SearchContent({ initialData }: SearchClientProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
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

  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!initialData || !searchQuery.trim()) {
        setResults({ cars: [], users: [], events: [], clubs: [] });
        return;
      }

      const searchTerm = searchQuery.toLowerCase();

      // Search cars
      const carResults = initialData.cars.filter(
        (car) =>
          car.brand.toLowerCase().includes(searchTerm) ||
          car.model.toLowerCase().includes(searchTerm) ||
          car.year.toString().includes(searchTerm)
      );

      // Search users
      const userResults = initialData.users.filter((user) =>
        user.username.toLowerCase().includes(searchTerm)
      );

      // Search events
      const eventResults = initialData.events.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm) ||
          (event.location &&
            event.location.toLowerCase().includes(searchTerm)) ||
          (event.description &&
            event.description.toLowerCase().includes(searchTerm))
      );

      // Search clubs
      const clubResults = initialData.clubs.filter(
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
    [initialData]
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  // Show loading state if data hasn't loaded yet
  if (!initialData) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold mb-2">Loading search data...</h3>
        <p className="text-muted-foreground">
          Please wait while we prepare the search functionality.
        </p>
      </div>
    );
  }

  const totalResults =
    results.cars.length +
    results.users.length +
    results.events.length +
    results.clubs.length;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Search Results</h1>
      </div>

      {query && (
        <div className="text-center mb-6">
          <p className="text-muted-foreground">
            {totalResults} results for &quot;{query}&quot;
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* No search query */}
        {!query && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to search</h3>
            <p className="text-muted-foreground">
              Use the search bar in the navigation to find cars, users, events,
              or clubs.
            </p>
          </div>
        )}

        {/* Cars Results */}
        {results.cars.length > 0 && (
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
              <Car className="h-5 w-5" />
              Cars ({results.cars.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                          Owner: {car.owner?.display_name || "Unknown"}
                        </p>
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
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({results.users.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.users.map((user) => (
                <Link key={user.id} href={`/profile/${user.username}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                          {user.profile_image_url ? (
                            <Image
                              src={user.profile_image_url}
                              alt={user.username}
                              fill
                              className="object-cover"
                              sizes="48px"
                              quality={100}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                              {user.username
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.username}</h3>
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
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Events ({results.events.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : new Date(event.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
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
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Clubs ({results.clubs.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.clubs.map((club) => (
                <Link key={club.id} href={`/clubs?club=${club.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer py-2">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                          {club.banner_image_url ? (
                            <Image
                              src={club.banner_image_url}
                              alt={club.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              quality={100}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-medium">
                              {club.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
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
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground">
              Try searching with different keywords or check your spelling.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export function SearchClient({ initialData }: SearchClientProps) {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent initialData={initialData} />
    </Suspense>
  );
}
