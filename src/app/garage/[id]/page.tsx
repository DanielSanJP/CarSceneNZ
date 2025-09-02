"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Car as CarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CarDetailPage() {
  const { user } = useAuth();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
  const isOwner = user && car.owner_id === user.id;
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
                  <div className="aspect-square bg-muted flex items-center justify-center"></div>
                ) : (
                  <Image
                    src={car.images[currentImageIndex]}
                    alt={`${car.brand} ${car.model} - Image ${
                      currentImageIndex + 1
                    }`}
                    fill
                    priority={currentImageIndex === 0}
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
                  <div className="flex items-center gap-4 mt-4"></div>
                </CardContent>
              </Card>

              {/* Engine Details */}
              {car.engine ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Engine Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
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
                      {car.engine.power_hp && car.engine.power_hp > 0 && (
                        <div>
                          <p className="text-muted-foreground">Power</p>
                          <p className="font-medium">
                            {car.engine.power_hp} HP
                          </p>
                        </div>
                      )}
                      {car.engine.torque_nm && car.engine.torque_nm > 0 && (
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
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Engine Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      No engine details available for this car.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Engine Modifications */}
              {(car.turbo_system ||
                car.exhaust_system ||
                car.engine_management ||
                car.internal_components ||
                car.fuel_system) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Engine Modifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Turbo System */}
                    {car.turbo_system &&
                      (car.turbo_system.turbo ||
                        car.turbo_system.intercooler) && (
                        <div className="space-y-2">
                          <h4 className="font-medium capitalize">
                            Turbo System
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {car.turbo_system.turbo && (
                              <div>
                                <p className="text-muted-foreground">Turbo</p>
                                <p className="font-medium">
                                  {car.turbo_system.turbo}
                                </p>
                              </div>
                            )}
                            {car.turbo_system.intercooler && (
                              <div>
                                <p className="text-muted-foreground">
                                  Intercooler
                                </p>
                                <p className="font-medium">
                                  {car.turbo_system.intercooler}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Exhaust System */}
                    {car.exhaust_system &&
                      (car.exhaust_system.intake ||
                        car.exhaust_system.header ||
                        car.exhaust_system.exhaust) && (
                        <div className="space-y-2">
                          <h4 className="font-medium capitalize">
                            Exhaust & Intake
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {car.exhaust_system.intake && (
                              <div>
                                <p className="text-muted-foreground">Intake</p>
                                <p className="font-medium">
                                  {car.exhaust_system.intake}
                                </p>
                              </div>
                            )}
                            {car.exhaust_system.header && (
                              <div>
                                <p className="text-muted-foreground">Header</p>
                                <p className="font-medium">
                                  {car.exhaust_system.header}
                                </p>
                              </div>
                            )}
                            {car.exhaust_system.exhaust && (
                              <div>
                                <p className="text-muted-foreground">Exhaust</p>
                                <p className="font-medium">
                                  {car.exhaust_system.exhaust}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Engine Management */}
                    {car.engine_management &&
                      (car.engine_management.ecu ||
                        car.engine_management.tuned_by) && (
                        <div className="space-y-2">
                          <h4 className="font-medium capitalize">
                            Engine Management
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {car.engine_management.ecu && (
                              <div>
                                <p className="text-muted-foreground">ECU</p>
                                <p className="font-medium">
                                  {car.engine_management.ecu}
                                </p>
                              </div>
                            )}
                            {car.engine_management.tuned_by && (
                              <div>
                                <p className="text-muted-foreground">
                                  Tuned By
                                </p>
                                <p className="font-medium">
                                  {car.engine_management.tuned_by}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Internal Components */}
                    {car.internal_components &&
                      (car.internal_components.pistons ||
                        car.internal_components.connecting_rods ||
                        car.internal_components.valves ||
                        car.internal_components.camshafts ||
                        car.internal_components.valve_springs) && (
                        <div className="space-y-2">
                          <h4 className="font-medium capitalize">
                            Internal Components
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {car.internal_components.pistons && (
                              <div>
                                <p className="text-muted-foreground">Pistons</p>
                                <p className="font-medium">
                                  {car.internal_components.pistons}
                                </p>
                              </div>
                            )}
                            {car.internal_components.connecting_rods && (
                              <div>
                                <p className="text-muted-foreground">
                                  Connecting Rods
                                </p>
                                <p className="font-medium">
                                  {car.internal_components.connecting_rods}
                                </p>
                              </div>
                            )}
                            {car.internal_components.valves && (
                              <div>
                                <p className="text-muted-foreground">Valves</p>
                                <p className="font-medium">
                                  {car.internal_components.valves}
                                </p>
                              </div>
                            )}
                            {car.internal_components.camshafts && (
                              <div>
                                <p className="text-muted-foreground">
                                  Camshafts
                                </p>
                                <p className="font-medium">
                                  {car.internal_components.camshafts}
                                </p>
                              </div>
                            )}
                            {car.internal_components.valve_springs && (
                              <div>
                                <p className="text-muted-foreground">
                                  Valve Springs
                                </p>
                                <p className="font-medium">
                                  {car.internal_components.valve_springs}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Fuel System */}
                    {car.fuel_system &&
                      (car.fuel_system.fuel_injectors ||
                        car.fuel_system.fuel_pump ||
                        car.fuel_system.fuel_rail) && (
                        <div className="space-y-2">
                          <h4 className="font-medium capitalize">
                            Fuel System
                          </h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {car.fuel_system.fuel_injectors && (
                              <div>
                                <p className="text-muted-foreground">
                                  Fuel Injectors
                                </p>
                                <p className="font-medium">
                                  {car.fuel_system.fuel_injectors}
                                </p>
                              </div>
                            )}
                            {car.fuel_system.fuel_pump && (
                              <div>
                                <p className="text-muted-foreground">
                                  Fuel Pump
                                </p>
                                <p className="font-medium">
                                  {car.fuel_system.fuel_pump}
                                </p>
                              </div>
                            )}
                            {car.fuel_system.fuel_rail && (
                              <div>
                                <p className="text-muted-foreground">
                                  Fuel Rail
                                </p>
                                <p className="font-medium">
                                  {car.fuel_system.fuel_rail}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {wheel.wheel && (
                              <div>
                                <p className="text-muted-foreground">Wheel</p>
                                <p className="font-medium">{wheel.wheel}</p>
                              </div>
                            )}
                            {wheel.wheel_size && (
                              <div>
                                <p className="text-muted-foreground">Size</p>
                                <p className="font-medium">
                                  {wheel.wheel_size}
                                </p>
                              </div>
                            )}
                            {wheel.wheel_offset && (
                              <div>
                                <p className="text-muted-foreground">Offset</p>
                                <p className="font-medium">
                                  {wheel.wheel_offset}
                                </p>
                              </div>
                            )}
                            {wheel.tyre && (
                              <div>
                                <p className="text-muted-foreground">Tyre</p>
                                <p className="font-medium">{wheel.tyre}</p>
                              </div>
                            )}
                            {wheel.tyre_size && (
                              <div>
                                <p className="text-muted-foreground">
                                  Tyre Size
                                </p>
                                <p className="font-medium">{wheel.tyre_size}</p>
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
                    {/* Display suspension type from any available entry */}
                    {(() => {
                      // First try to get from general entry (no position)
                      const generalSuspension = car.suspension.find(
                        (s) => !s.position
                      );
                      // If no general entry, get from any position-specific entry
                      const anySuspension =
                        generalSuspension ||
                        car.suspension.find((s) => s.suspension_type);

                      if (anySuspension?.suspension_type) {
                        return (
                          <div className="mb-4">
                            <p className="text-sm">
                              <span className="text-muted-foreground">
                                Type:{" "}
                              </span>
                              <span className="font-medium capitalize">
                                {anySuspension.suspension_type}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {["front", "rear"].map((position) => {
                      const susp = getSuspensionByPosition(
                        position as "front" | "rear"
                      );
                      if (!susp) return null;

                      return (
                        <div key={position} className="space-y-4">
                          <h4 className="font-medium capitalize">
                            {position} Suspension
                          </h4>

                          {/* Suspension Components */}
                          {(susp.suspension || susp.spring_rate) && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">
                                Suspension Components
                              </h5>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {susp.suspension && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Setup
                                    </p>
                                    <p className="font-medium">
                                      {susp.suspension}
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
                              </div>
                            </div>
                          )}

                          {/* Wheel Alignment */}
                          {(susp.camber_degrees !== undefined ||
                            susp.toe_degrees ||
                            susp.caster_degrees) && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">
                                Wheel Alignment
                              </h5>
                              <div className="grid grid-cols-3 gap-4 text-sm">
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
                          )}

                          {/* Anti-Roll System */}
                          {(susp.anti_roll_bar || susp.strut_brace) && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">
                                Anti-Roll System
                              </h5>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {susp.anti_roll_bar && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Anti-Roll Bar
                                    </p>
                                    <p className="font-medium">
                                      {susp.anti_roll_bar}
                                    </p>
                                  </div>
                                )}
                                {susp.strut_brace && (
                                  <div>
                                    <p className="text-muted-foreground">
                                      Strut Brace
                                    </p>
                                    <p className="font-medium">
                                      {susp.strut_brace}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Brakes */}
              {car.brakes && car.brakes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Brakes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {["front", "rear"].map((position) => {
                      const brake = getBrakesByPosition(
                        position as "front" | "rear"
                      );
                      if (!brake) return null;

                      return (
                        <div key={position} className="space-y-2">
                          <h4 className="font-medium capitalize">{position}</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            {brake.caliper && (
                              <div>
                                <p className="text-muted-foreground">Caliper</p>
                                <p className="font-medium">{brake.caliper}</p>
                              </div>
                            )}
                            {brake.disc_size && (
                              <div>
                                <p className="text-muted-foreground">
                                  Disc Size
                                </p>
                                <p className="font-medium">{brake.disc_size}</p>
                              </div>
                            )}
                            {brake.disc_type && (
                              <div>
                                <p className="text-muted-foreground">
                                  Disc Type
                                </p>
                                <p className="font-medium capitalize">
                                  {brake.disc_type}
                                </p>
                              </div>
                            )}
                            {brake.pads && (
                              <div>
                                <p className="text-muted-foreground">Pads</p>
                                <p className="font-medium">{brake.pads}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Exterior Modifications */}
              {(car.paint_finish ||
                car.lighting_modifications ||
                car.bodykit_modifications) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Exterior Modifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Paint & Finish */}
                    {car.paint_finish && (
                      <div>
                        <h4 className="font-medium mb-2">Paint & Finish</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {car.paint_finish.paint_color && (
                            <div>
                              <p className="text-muted-foreground">
                                Paint Color
                              </p>
                              <p className="font-medium">
                                {car.paint_finish.paint_color}
                              </p>
                            </div>
                          )}
                          {car.paint_finish.paint_finish && (
                            <div>
                              <p className="text-muted-foreground">
                                Finish Type
                              </p>
                              <p className="font-medium">
                                {car.paint_finish.paint_finish}
                              </p>
                            </div>
                          )}
                          {car.paint_finish.wrap_brand && (
                            <div>
                              <p className="text-muted-foreground">Wrap</p>
                              <p className="font-medium">
                                {car.paint_finish.wrap_brand} -{" "}
                                {car.paint_finish.wrap_color}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Lighting */}
                    {car.lighting_modifications && (
                      <div>
                        <h4 className="font-medium mb-2">Lighting</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {car.lighting_modifications.headlights && (
                            <div>
                              <p className="text-muted-foreground">
                                Headlights
                              </p>
                              <p className="font-medium">
                                {car.lighting_modifications.headlights}
                              </p>
                            </div>
                          )}
                          {car.lighting_modifications.taillights && (
                            <div>
                              <p className="text-muted-foreground">
                                Taillights
                              </p>
                              <p className="font-medium">
                                {car.lighting_modifications.taillights}
                              </p>
                            </div>
                          )}
                          {car.lighting_modifications.underglow && (
                            <div>
                              <p className="text-muted-foreground">Underglow</p>
                              <p className="font-medium">
                                {car.lighting_modifications.underglow}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bodykit */}
                    {car.bodykit_modifications && (
                      <div>
                        <h4 className="font-medium mb-2">Bodykit</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {car.bodykit_modifications.front_bumper && (
                            <div>
                              <p className="text-muted-foreground">
                                Front Bumper
                              </p>
                              <p className="font-medium">
                                {car.bodykit_modifications.front_bumper}
                              </p>
                            </div>
                          )}
                          {car.bodykit_modifications.rear_bumper && (
                            <div>
                              <p className="text-muted-foreground">
                                Rear Bumper
                              </p>
                              <p className="font-medium">
                                {car.bodykit_modifications.rear_bumper}
                              </p>
                            </div>
                          )}
                          {car.bodykit_modifications.side_skirts && (
                            <div>
                              <p className="text-muted-foreground">
                                Side Skirts
                              </p>
                              <p className="font-medium">
                                {car.bodykit_modifications.side_skirts}
                              </p>
                            </div>
                          )}
                          {car.bodykit_modifications.rear_spoiler && (
                            <div>
                              <p className="text-muted-foreground">
                                Rear Spoiler
                              </p>
                              <p className="font-medium">
                                {car.bodykit_modifications.rear_spoiler}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Interior Modifications */}
              {(car.seats ||
                car.steering_wheel ||
                car.audio_system ||
                (car.gauges && car.gauges.length > 0)) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Interior Modifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Seats */}
                    {car.seats && (
                      <div>
                        <h4 className="font-medium mb-2">Seats</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {car.seats.front_seats && (
                            <div>
                              <p className="text-muted-foreground">
                                Front Seats
                              </p>
                              <p className="font-medium">
                                {car.seats.front_seats}
                              </p>
                            </div>
                          )}
                          {car.seats.rear_seats && (
                            <div>
                              <p className="text-muted-foreground">
                                Rear Seats
                              </p>
                              <p className="font-medium">
                                {car.seats.rear_seats}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Steering Wheel */}
                    {car.steering_wheel &&
                      car.steering_wheel.steering_wheel && (
                        <div>
                          <h4 className="font-medium mb-2">Steering Wheel</h4>
                          <div className="text-sm">
                            <p className="font-medium">
                              {car.steering_wheel.steering_wheel}
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Audio System */}
                    {car.audio_system && (
                      <div>
                        <h4 className="font-medium mb-2">Audio System</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {car.audio_system.head_unit && (
                            <div>
                              <p className="text-muted-foreground">Head Unit</p>
                              <p className="font-medium">
                                {car.audio_system.head_unit}
                              </p>
                            </div>
                          )}
                          {car.audio_system.speakers && (
                            <div>
                              <p className="text-muted-foreground">Speakers</p>
                              <p className="font-medium">
                                {car.audio_system.speakers}
                              </p>
                            </div>
                          )}
                          {car.audio_system.subwoofer && (
                            <div>
                              <p className="text-muted-foreground">Subwoofer</p>
                              <p className="font-medium">
                                {car.audio_system.subwoofer}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Gauges */}
                    {car.gauges && car.gauges.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Gauges</h4>
                        <div className="flex flex-wrap gap-2">
                          {car.gauges.map((gauge) => (
                            <span
                              key={gauge.id}
                              className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                            >
                              {gauge.gauge_type}{" "}
                              {gauge.brand && `- ${gauge.brand}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
