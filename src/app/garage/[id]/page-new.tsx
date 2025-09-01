"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-provider";
import { getCarById } from "@/lib/data/cars";
import type { Car } from "@/types/car";

import {
  ArrowLeft,
  Edit3,
  Star,
  Eye,
  Car as CarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CarDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;

  // State for car data and loading
  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Fetch car data
  useEffect(() => {
    async function fetchCar() {
      if (!carId) return;

      setIsLoading(true);
      setError(null);

      try {
        const carData = await getCarById(carId);
        if (carData) {
          setCar(carData);
        } else {
          setError("Car not found");
        }
      } catch (err) {
        console.error("Error fetching car:", err);
        setError("Failed to load car data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCar();
  }, [carId]);

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/garage");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to view car details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading...</h1>
            <p className="text-muted-foreground mt-2">
              Fetching car details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">{error || "Car Not Found"}</h1>
            <p className="text-muted-foreground mt-2">
              {error || "The car you're looking for doesn't exist."}
            </p>
            <Link href="/garage" className="mt-4 inline-block">
              <Button>Back to Garage</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Check if user owns this car
  const isOwner = car.owner_id === user.id;
  const owner = car.owner;

  const handleImageError = (imageIndex: number) => {
    setFailedImages((prev) => new Set(prev).add(`${carId}-${imageIndex}`));
  };

  const openModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  const navigateModal = (direction: "prev" | "next") => {
    const imageLength = car?.images?.length || 0;
    if (imageLength === 0) return;

    if (direction === "prev") {
      setModalImageIndex((prev) => (prev === 0 ? imageLength - 1 : prev - 1));
    } else {
      setModalImageIndex((prev) => (prev === imageLength - 1 ? 0 : prev + 1));
    }
  };

  // Helper function to get wheels by position
  const getWheelsByPosition = (position: "front" | "rear") => {
    return car.wheels?.find((wheel) => wheel.position === position);
  };

  // Helper function to get suspension by position
  const getSuspensionByPosition = (position: "front" | "rear") => {
    return car.suspension?.find((susp) => susp.position === position);
  };

  // Helper function to get brakes by position
  const getBrakesByPosition = (position: "front" | "rear") => {
    return car.brakes?.find((brake) => brake.position === position);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleBackClick}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {car.year} {car.brand} {car.model}
                </h1>
              </div>
            </div>

            {isOwner && (
              <Link href={`/garage/edit/${car.id}`}>
                <Button size="sm" className="md:px-4">
                  <Edit3 className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Edit Car</span>
                </Button>
              </Link>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Images */}
            <div className="space-y-4">
              <div
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
                onClick={() => openModal(currentImageIndex)}
              >
                {failedImages.has(`${carId}-${currentImageIndex}`) ||
                !car.images?.[currentImageIndex] ? (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <CarIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                ) : (
                  <Image
                    src={car.images[currentImageIndex]}
                    alt={`${car.brand} ${car.model} - Image ${
                      currentImageIndex + 1
                    }`}
                    fill
                    quality={100}
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    onError={() => handleImageError(currentImageIndex)}
                  />
                )}
              </div>

              {/* Image thumbnails */}
              {(car.images?.length || 0) > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {car.images?.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded border-2 transition-colors ${
                        currentImageIndex === index
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      }`}
                    >
                      {failedImages.has(`${carId}-${index}`) ||
                      !car.images?.[index] ? (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <CarIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <Image
                          src={car.images[index]}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12.5vw"
                          onError={() => handleImageError(index)}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Owner Details */}
              {owner && (
                <Link href={`/profile/${owner.username}`}>
                  <Card className="transition-all hover:shadow-lg cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Owner Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                          {owner.profile_image_url ? (
                            <Image
                              src={owner.profile_image_url}
                              alt={owner.display_name || owner.username}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-medium">
                              {(owner.display_name || owner.username)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg hover:underline">
                            {owner.display_name || owner.username}
                          </h3>
                          <p className="text-muted-foreground">
                            @{owner.username}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* Car Details */}
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CarIcon className="h-5 w-5" />
                    Car Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Year</p>
                      <p className="font-medium">{car.year}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Make</p>
                      <p className="font-medium">{car.brand}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Model</p>
                      <p className="font-medium">{car.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{car.total_likes} likes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Engine Details */}
              {car.engine && (
                <Card>
                  <CardHeader>
                    <CardTitle>Engine Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {car.engine.engine_code && (
                        <div>
                          <p className="text-muted-foreground">Engine Code</p>
                          <p className="font-medium">
                            {car.engine.engine_code}
                          </p>
                        </div>
                      )}
                      {car.engine.displacement && (
                        <div>
                          <p className="text-muted-foreground">Displacement</p>
                          <p className="font-medium">
                            {car.engine.displacement}
                          </p>
                        </div>
                      )}
                      {car.engine.aspiration && (
                        <div>
                          <p className="text-muted-foreground">Aspiration</p>
                          <p className="font-medium capitalize">
                            {car.engine.aspiration}
                          </p>
                        </div>
                      )}
                      {car.engine.power_hp && (
                        <div>
                          <p className="text-muted-foreground">Power</p>
                          <p className="font-medium">
                            {car.engine.power_hp} HP
                          </p>
                        </div>
                      )}
                      {car.engine.torque_nm && (
                        <div>
                          <p className="text-muted-foreground">Torque</p>
                          <p className="font-medium">
                            {car.engine.torque_nm} Nm
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Engine Modifications */}
              {car.engine_modifications &&
                car.engine_modifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Engine Modifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {car.engine_modifications.map((mod) => (
                          <div
                            key={mod.id}
                            className="border-l-2 border-primary pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium capitalize">
                                {mod.component}
                              </h4>
                              {mod.is_custom && (
                                <span className="text-xs bg-secondary px-2 py-1 rounded">
                                  Custom
                                </span>
                              )}
                            </div>
                            {(mod.brand || mod.model) && (
                              <p className="text-sm text-muted-foreground">
                                {mod.brand} {mod.model}
                              </p>
                            )}
                            {mod.description && (
                              <p className="text-sm">{mod.description}</p>
                            )}
                            {mod.tuned_by && (
                              <p className="text-xs text-muted-foreground">
                                Tuned by: {mod.tuned_by}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Wheels & Tires */}
              {car.wheels && car.wheels.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Wheels & Tires</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {["front", "rear"].map((position) => {
                      const wheel = getWheelsByPosition(
                        position as "front" | "rear"
                      );
                      if (!wheel) return null;

                      return (
                        <div key={position} className="space-y-2">
                          <h4 className="font-medium capitalize">{position}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {wheel.wheel_brand && wheel.wheel_size && (
                              <div>
                                <p className="text-muted-foreground">Wheels</p>
                                <p className="font-medium">
                                  {wheel.wheel_brand} {wheel.wheel_size}
                                </p>
                                {wheel.wheel_offset && (
                                  <p className="text-xs text-muted-foreground">
                                    Offset: {wheel.wheel_offset}
                                  </p>
                                )}
                              </div>
                            )}
                            {wheel.tire_size && (
                              <div>
                                <p className="text-muted-foreground">Tires</p>
                                <p className="font-medium">{wheel.tire_size}</p>
                              </div>
                            )}
                            {wheel.camber_degrees !== undefined && (
                              <div>
                                <p className="text-muted-foreground">Camber</p>
                                <p className="font-medium">
                                  {wheel.camber_degrees}°
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Suspension */}
              {car.suspension && car.suspension.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Suspension</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {car.suspension.find((s) => !s.position) && (
                      <div className="mb-4">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium capitalize">
                            {
                              car.suspension.find((s) => !s.position)
                                ?.suspension_type
                            }
                          </span>
                        </p>
                      </div>
                    )}
                    {["front", "rear"].map((position) => {
                      const susp = getSuspensionByPosition(
                        position as "front" | "rear"
                      );
                      if (!susp) return null;

                      return (
                        <div key={position} className="space-y-2">
                          <h4 className="font-medium capitalize">{position}</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {(susp.brand || susp.model) && (
                              <div>
                                <p className="text-muted-foreground">Setup</p>
                                <p className="font-medium">
                                  {susp.brand} {susp.model}
                                </p>
                              </div>
                            )}
                            {susp.spring_rate && (
                              <div>
                                <p className="text-muted-foreground">
                                  Spring Rate
                                </p>
                                <p className="font-medium">
                                  {susp.spring_rate}
                                </p>
                              </div>
                            )}
                            <div className="col-span-2 grid grid-cols-3 gap-2">
                              {susp.camber_degrees !== undefined && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Camber
                                  </p>
                                  <p className="font-medium">
                                    {susp.camber_degrees}°
                                  </p>
                                </div>
                              )}
                              {susp.toe_degrees && (
                                <div>
                                  <p className="text-muted-foreground">Toe</p>
                                  <p className="font-medium">
                                    {susp.toe_degrees}
                                  </p>
                                </div>
                              )}
                              {susp.caster_degrees && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Caster
                                  </p>
                                  <p className="font-medium">
                                    {susp.caster_degrees}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Performance Modifications */}
              {car.performance_mods && car.performance_mods.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Modifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["weight_reduction", "aero", "chassis", "cooling"].map(
                        (category) => {
                          const mods = car.performance_mods?.filter(
                            (mod) => mod.category === category
                          );
                          if (!mods || mods.length === 0) return null;

                          return (
                            <div key={category}>
                              <h4 className="font-medium capitalize mb-2">
                                {category.replace("_", " ")}
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {mods.map((mod) => (
                                  <span
                                    key={mod.id}
                                    className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                                  >
                                    {mod.modification}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Like Section */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm mb-2">
                      Added on {new Date(car.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-4 w-4" />
                      <span className="font-medium">
                        {car.total_likes} likes
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="!max-w-none !w-screen !h-screen !p-0 !m-0 !rounded-none bg-background border-none"
            showCloseButton={true}
          >
            <DialogTitle className="sr-only">
              {car.brand} {car.model} Image Gallery
            </DialogTitle>
            <div className="relative w-full h-full flex flex-col">
              <div className="relative flex-1 flex items-center justify-center p-4 pt-16">
                {car.images && car.images[modalImageIndex] && (
                  <Image
                    src={car.images[modalImageIndex]}
                    alt={`${car.brand} ${car.model} - Image ${
                      modalImageIndex + 1
                    }`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                )}

                {/* Navigation buttons */}
                {(car.images?.length || 0) > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                      onClick={() => navigateModal("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                      onClick={() => navigateModal("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Image counter */}
              {(car.images?.length || 0) > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1">
                  <div className="text-center text-sm">
                    {modalImageIndex + 1} / {car.images?.length}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
