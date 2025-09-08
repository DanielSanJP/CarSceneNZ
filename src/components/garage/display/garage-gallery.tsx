"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LikeButton } from "@/components/ui/like-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car as CarIcon, Eye, Star, User, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import type { Car } from "@/types/car";

// Gallery car type for display
type GalleryCar = Pick<
  Car,
  | "id"
  | "brand"
  | "model"
  | "year"
  | "images"
  | "total_likes"
  | "created_at"
  | "owner_id"
  | "is_liked"
> & {
  owner: {
    id: string;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
};

interface GarageGalleryProps {
  cars: GalleryCar[];
  user?: {
    id: string;
    username: string;
    display_name?: string;
  } | null;
  onLike?: (
    carId: string,
    userId: string
  ) => Promise<{ success: boolean; newLikeCount?: number; error?: string }>;
  onUnlike?: (
    carId: string,
    userId: string
  ) => Promise<{ success: boolean; newLikeCount?: number; error?: string }>;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  totalCars?: number;
}

export function GarageGallery({
  cars,
  user,
  onLike,
  onUnlike,
  currentPage = 1,
  totalPages = 1,
  totalCars = 0,
}: GarageGalleryProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [carLikeCounts, setCarLikeCounts] = useState<Record<string, number>>(
    () => {
      // Initialize with current like counts
      const counts: Record<string, number> = {};
      cars.forEach((car) => {
        counts[car.id] = car.total_likes;
      });
      return counts;
    }
  );

  // Combined filter state to reduce re-renders
  const [filters, setFilters] = useState({
    brand: "all",
    model: "all",
    year: "all",
    sort: "newest",
  });

  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  const handleLikeCountChange = (carId: string, newCount: number) => {
    setCarLikeCounts((prev) => ({
      ...prev,
      [carId]: newCount,
    }));
  };

  // Memoized filter handlers to prevent unnecessary re-renders
  const updateFilter = useMemo(
    () => ({
      brand: (value: string) =>
        setFilters((prev) => ({ ...prev, brand: value, model: "all" })),
      model: (value: string) =>
        setFilters((prev) => ({ ...prev, model: value })),
      year: (value: string) => setFilters((prev) => ({ ...prev, year: value })),
      sort: (value: string) => setFilters((prev) => ({ ...prev, sort: value })),
    }),
    []
  );

  // Get unique brands from cars (memoized)
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(cars.map((car) => car.brand))].sort();
    return uniqueBrands;
  }, [cars]);

  // Get unique models from cars (filtered by selected brand)
  const models = useMemo(() => {
    if (filters.brand === "all") {
      return []; // Don't show any models if no brand is selected
    }
    const filteredCars = cars.filter((car) => car.brand === filters.brand);
    const uniqueModels = [
      ...new Set(filteredCars.map((car) => car.model)),
    ].sort();
    return uniqueModels;
  }, [cars, filters.brand]);

  // Get unique years from cars (memoized)
  const years = useMemo(() => {
    const uniqueYears = [...new Set(cars.map((car) => car.year))].sort(
      (a, b) => b - a
    );
    return uniqueYears;
  }, [cars]);

  // Filter and sort cars (optimized with combined filter state)
  const filteredAndSortedCars = useMemo(() => {
    let filtered = [...cars];

    // Apply brand filter
    if (filters.brand !== "all") {
      filtered = filtered.filter((car) => car.brand === filters.brand);
    }

    // Apply model filter
    if (filters.model !== "all") {
      filtered = filtered.filter((car) => car.model === filters.model);
    }

    // Apply year filter
    if (filters.year !== "all") {
      filtered = filtered.filter((car) => car.year.toString() === filters.year);
    }

    // Apply sorting
    if (filters.sort === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (filters.sort === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (filters.sort === "most_liked") {
      filtered.sort(
        (a, b) =>
          (carLikeCounts[b.id] ?? b.total_likes) -
          (carLikeCounts[a.id] ?? a.total_likes)
      );
    } else if (filters.sort === "least_liked") {
      filtered.sort(
        (a, b) =>
          (carLikeCounts[a.id] ?? a.total_likes) -
          (carLikeCounts[b.id] ?? b.total_likes)
      );
    }

    return filtered;
  }, [cars, filters, carLikeCounts]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Car Gallery</h1>
          <p className="text-muted-foreground mt-2">
            Discover amazing builds from the community
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {user && (
            <Link href="/garage/my-garage" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <CarIcon className="h-4 w-4" />
                My Garage
              </Button>
            </Link>
          )}
          {user && (
            <Link href="/garage/create" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" />
                Add Car
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Mobile: Stack filters vertically, Desktop: Grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select value={filters.brand} onValueChange={updateFilter.brand}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.model}
            onValueChange={updateFilter.model}
            disabled={filters.brand === "all"}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  filters.brand === "all" ? "Select brand first" : "All Models"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.year} onValueChange={updateFilter.year}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.sort} onValueChange={updateFilter.sort}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
              <SelectItem value="least_liked">Least Liked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count - separate row for better mobile layout */}
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          {filteredAndSortedCars.length} cars found
        </div>
      </div>

      {/* Cars Grid */}
      {filteredAndSortedCars.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No cars found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or check back later for new builds
            </p>
            {user && (
              <Link href="/garage/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your Car
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedCars.map((car) => (
            <Link href={`/garage/${car.id}`} key={car.id} className="group">
              <Card className="overflow-hidden pt-0 hover:shadow-lg transition-shadow">
                {/* Car Image */}
                <div className="relative aspect-square overflow-hidden">
                  {failedImages.has(car.id) || !car.images?.[0] ? (
                    <div className="aspect-square bg-muted flex items-center justify-center">
                      <CarIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  ) : (
                    <Image
                      src={car.images[0]}
                      alt={`${car.brand} ${car.model}`}
                      fill
                      quality={100}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={() => handleImageError(car.id)}
                    />
                  )}

                  {/* Like Button - Top Right */}
                  <div className="absolute top-2 right-2">
                    <LikeButton
                      carId={car.id}
                      initialIsLiked={car.is_liked || false}
                      variant="floating"
                      size="xl"
                      user={user}
                      onLike={onLike}
                      onUnlike={onUnlike}
                      onLikeCountChange={(newCount) =>
                        handleLikeCountChange(car.id, newCount)
                      }
                    />
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {car.year} {car.brand} {car.model}
                  </CardTitle>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {carLikeCounts[car.id] ?? car.total_likes} likes
                    </span>
                    {car.owner && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {car.owner.display_name || car.owner.username}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/garage/${car.id}`;
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Link
            href={`/garage?page=${currentPage - 1}`}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          >
            <Button variant="outline" disabled={currentPage <= 1}>
              Previous
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > totalPages) return null;

              return (
                <Link key={page} href={`/garage?page=${page}`}>
                  <Button
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                  >
                    {page}
                  </Button>
                </Link>
              );
            })}
          </div>

          <Link
            href={`/garage?page=${currentPage + 1}`}
            className={
              currentPage >= totalPages ? "pointer-events-none opacity-50" : ""
            }
          >
            <Button variant="outline" disabled={currentPage >= totalPages}>
              Next
            </Button>
          </Link>
        </div>
      )}

      {/* Results info */}
      <div className="text-center text-sm text-muted-foreground mt-4">
        Showing {cars.length} of {totalCars} cars
        {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
      </div>
    </div>
  );
}
