"use client";

import { useCurrentUser } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllCars } from "@/lib/data/cars";
import { Car as CarIcon, Eye, Star, User, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import type { Car } from "@/types/car";

export default function GaragePage() {
  const user = useCurrentUser();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Filter states
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const carsData = await getAllCars();
        setCars(carsData);
      } catch (error) {
        console.error("Error fetching cars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleImageError = (carId: string) => {
    setFailedImages((prev) => new Set(prev).add(carId));
  };

  // Get unique brands from cars
  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(cars.map((car) => car.brand))].sort();
    return uniqueBrands;
  }, [cars]);

  // Get unique models from cars (filtered by selected brand)
  const models = useMemo(() => {
    if (brandFilter === "all") {
      return []; // Don't show any models if no brand is selected
    }
    const filteredCars = cars.filter((car) => car.brand === brandFilter);
    const uniqueModels = [
      ...new Set(filteredCars.map((car) => car.model)),
    ].sort();
    return uniqueModels;
  }, [cars, brandFilter]);

  // Get unique years from cars
  const years = useMemo(() => {
    const uniqueYears = [...new Set(cars.map((car) => car.year))].sort(
      (a, b) => b - a
    );
    return uniqueYears;
  }, [cars]);

  // Filter and sort cars
  const filteredAndSortedCars = useMemo(() => {
    let filtered = [...cars];

    // Apply brand filter
    if (brandFilter !== "all") {
      filtered = filtered.filter((car) => car.brand === brandFilter);
    }

    // Apply model filter
    if (modelFilter !== "all") {
      filtered = filtered.filter((car) => car.model === modelFilter);
    }

    // Apply year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter((car) => car.year.toString() === yearFilter);
    }

    // Apply sorting
    if (sortOrder === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortOrder === "oldest") {
      filtered.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortOrder === "most_liked") {
      filtered.sort((a, b) => (b.total_likes || 0) - (a.total_likes || 0));
    } else if (sortOrder === "least_liked") {
      filtered.sort((a, b) => (a.total_likes || 0) - (b.total_likes || 0));
    }

    return filtered;
  }, [cars, brandFilter, modelFilter, yearFilter, sortOrder]);

  // Reset model filter when brand changes
  useEffect(() => {
    setModelFilter("all");
  }, [brandFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <CarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading garage...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Car Gallery</h1>
              <p className="text-muted-foreground mt-2">
                Discover amazing builds from the community
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <Link href="/garage/my-garage">
                  <Button variant="outline" className="flex items-center gap-2">
                    <CarIcon className="h-4 w-4" />
                    My Garage
                  </Button>
                </Link>
              )}
              {user && (
                <Link href="/garage/create">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Car
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger>
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
              value={modelFilter}
              onValueChange={setModelFilter}
              disabled={brandFilter === "all"}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    brandFilter === "all" ? "Select brand first" : "All Models"
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

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
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

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most_liked">Most Liked</SelectItem>
                <SelectItem value="least_liked">Least Liked</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
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
                    </div>

                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        {car.year} {car.brand} {car.model}
                      </CardTitle>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {car.total_likes} likes
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
        </div>
      </div>
    </div>
  );
}
