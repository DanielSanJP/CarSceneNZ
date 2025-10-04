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
import { useRouter } from "next/navigation";
import type { GarageData } from "@/types/car";
import { LeftSidebarAd, RightSidebarAd } from "@/components/ads/ad-placements";

interface GarageGalleryProps {
  page?: number;
  limit?: number;
  garageData: GarageData | null;
  likeCarAction?: (carId: string) => Promise<{
    success: boolean;
    error?: string;
    likeCount?: number;
    isLiked?: boolean;
  }>;
}

type SortOption =
  | "newest_year"
  | "oldest_year"
  | "most_liked"
  | "least_liked"
  | "recently_added"
  | "oldest_added";

export function GarageGallery({
  garageData,
  likeCarAction,
}: GarageGalleryProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [carLikeCounts, setCarLikeCounts] = useState<Record<string, number>>(
    {}
  );
  const [filters, setFilters] = useState({
    brand: "all",
    model: "all",
    year: "all",
    sort: "newest_year" as SortOption,
  });
  const router = useRouter();

  // Pre-compute data for hooks
  const cars = useMemo(() => garageData?.cars || [], [garageData?.cars]);
  const currentUser = garageData?.currentUser || null;

  // Memoized filter handlers to prevent unnecessary re-renders
  const updateFilter = useMemo(
    () => ({
      brand: (value: string) =>
        setFilters((prev) => ({ ...prev, brand: value, model: "all" })),
      model: (value: string) =>
        setFilters((prev) => ({ ...prev, model: value })),
      year: (value: string) => setFilters((prev) => ({ ...prev, year: value })),
      sort: (value: string) =>
        setFilters((prev) => ({ ...prev, sort: value as SortOption })),
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
    if (filters.sort === "newest_year") {
      filtered.sort((a, b) => b.year - a.year);
    } else if (filters.sort === "oldest_year") {
      filtered.sort((a, b) => a.year - b.year);
    } else if (filters.sort === "recently_added") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (filters.sort === "oldest_added") {
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

  // Handle no data state
  if (!garageData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              Failed to load garage. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle image loading errors
  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  // Handle like count changes
  const handleLikeCountChange = (carId: string, newCount: number) => {
    setCarLikeCounts((prev) => ({
      ...prev,
      [carId]: newCount,
    }));
  };

  // Handle car like/unlike with Server Actions
  const handleLike = async (carId: string) => {
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      if (!likeCarAction) {
        console.error("likeCarAction not provided");
        return { success: false, error: "Like action not available" };
      }

      const result = await likeCarAction(carId);
      if (result.success && result.likeCount !== undefined) {
        handleLikeCountChange(carId, result.likeCount);
      }
      return result;
    } catch (error) {
      console.error("Error liking car:", error);
      return { success: false, error: "Failed to like car" };
    }
  };

  const handleUnlike = async (carId: string) => {
    if (!currentUser) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      if (!likeCarAction) {
        console.error("likeCarAction not provided");
        return { success: false, error: "Unlike action not available" };
      }

      const result = await likeCarAction(carId);
      if (result.success && result.likeCount !== undefined) {
        handleLikeCountChange(carId, result.likeCount);
      }
      return result;
    } catch (error) {
      console.error("Error unliking car:", error);
      return { success: false, error: "Failed to unlike car" };
    }
  };

  return (
    <div className="flex gap-6 justify-center px-4 sm:px-6 lg:px-8">
      {/* Left Sidebar - Hidden on mobile/tablet, visible on xl screens */}
      <aside className="hidden xl:block w-[200px] flex-shrink-0 sticky top-4 h-fit">
        <LeftSidebarAd />
      </aside>

      {/* Main Content */}
      <main className="w-full max-w-7xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Car Gallery</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Discover amazing builds from the community
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Flexible filter layout - BMY on one line, Sort can wrap */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <div className="flex flex-1 min-w-0 gap-2 sm:gap-3">
              <Select value={filters.brand} onValueChange={updateFilter.brand}>
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm flex-1 min-w-[80px]">
                  <SelectValue placeholder="Brand" />
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
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm flex-1 min-w-[80px]">
                  <SelectValue placeholder="Model" />
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
                <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm flex-1 min-w-[70px]">
                  <SelectValue placeholder="Year" />
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
            </div>

            <Select value={filters.sort} onValueChange={updateFilter.sort}>
              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm w-full sm:w-auto sm:min-w-[120px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest_year">Newest Cars</SelectItem>
                <SelectItem value="oldest_year">Oldest Cars</SelectItem>
                <SelectItem value="most_liked">Most Liked</SelectItem>
                <SelectItem value="least_liked">Least Liked</SelectItem>
                <SelectItem value="recently_added">Recently Added</SelectItem>
                <SelectItem value="oldest_added">Oldest Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results count - compact */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
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
              {currentUser && (
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
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedCars.map((car) => (
              <Link href={`/garage/${car.id}`} key={car.id} className="group">
                <Card className="overflow-hidden pt-0 hover:shadow-lg transition-shadow">
                  {/* Car Image */}
                  <div className="relative aspect-square overflow-hidden">
                    {failedImages.has(car.id) ||
                    !car.images?.[0] ||
                    car.images[0].trim() === "" ? (
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
                        user={currentUser}
                        onLike={handleLike}
                        onUnlike={handleUnlike}
                        onLikeCountChange={(newCount) =>
                          handleLikeCountChange(car.id, newCount)
                        }
                      />
                    </div>
                  </div>

                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">
                      {car.year} {car.brand} {car.model}
                    </CardTitle>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {carLikeCounts[car.id] ?? car.total_likes}
                      </span>
                      {car.owner && (
                        <span className="flex items-center gap-1 truncate">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {car.owner.display_name || car.owner.username}
                          </span>
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 pb-3 sm:pb-4">
                    {/* Action Buttons */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 sm:h-9"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/garage/${car.id}`);
                      }}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                      <span className="text-xs sm:text-sm">View Details</span>
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Results info */}
        <div className="text-center text-xs sm:text-sm text-muted-foreground mt-3">
          Showing {filteredAndSortedCars.length} of {cars.length} cars
        </div>
      </main>

      {/* Right Sidebar - Hidden on mobile/tablet, visible on xl screens */}
      <aside className="hidden xl:block w-[200px] flex-shrink-0 sticky top-4 h-fit">
        <RightSidebarAd />
      </aside>
    </div>
  );
}
