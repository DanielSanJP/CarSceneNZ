"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getCarById, getCarsByOwner } from "@/data";
import { getUserById } from "@/data";
import type { Car, User } from "@/types";
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
    front?: string;
    rear?: string;
  };
  engine?: {
    engine_code: string;
    displacement: string;
    aspiration: string;
    power_hp: number;
    torque_nm: number;
    modifications?: {
      turbo?: {
        brand: string;
        model: string;
        custom?: boolean;
      };
      intercooler?: {
        brand: string;
        model: string;
        custom?: boolean;
      };
      exhaust?: {
        header: string;
        catback: string;
        custom?: boolean;
      };
      intake?: {
        brand: string;
        model: string;
        custom?: boolean;
      };
      ecu?: {
        brand: string;
        model: string;
        tuned_by: string;
      };
      internals?: {
        pistons: string;
        rods: string;
        valves: string;
        springs: string;
        cams: string;
      };
      fuel_system?: {
        injectors: string;
        fuel_pump: string;
        fuel_rail: string;
      };
    };
  };
  suspension?: {
    front?: {
      caster?: string;
      toe?: string;
      camber?: number;
    };
    rear?: {
      caster?: string;
      toe?: string;
      camber?: number;
    };
    anti_roll_bars?: {
      front?: string;
      rear?: string;
    };
    strut_braces?: string[];
  };
  exterior?: {
    body_kit?: {
      front_bumper?: string;
      rear_bumper?: string;
      side_skirts?: string;
      rear_wing?: string;
    };
    paint?: {
      color?: string;
      type?: string;
      finish?: string;
    };
    lighting?: {
      headlights?: string;
      taillights?: string;
      indicators?: string;
    };
  };
  brakes?: {
    front?: {
      caliper?: string;
      disc_size?: string;
      disc_type?: string;
      pads?: string;
    };
    rear?: {
      caliper?: string;
      disc_size?: string;
      disc_type?: string;
      pads?: string;
    };
    brake_lines?: string;
    master_cylinder?: string;
  };
  interior?: {
    seats?: {
      front?: string;
      rear?: string;
    };
    steering_wheel?: {
      brand: string;
      model: string;
      size: string;
    };
    gauges?: string;
    roll_cage?: {
      brand: string;
      points: number;
      material: string;
    };
    audio?: {
      head_unit: string;
      speakers: string;
      subwoofer: string;
    };
  };
  performance_mods?: {
    weight_reduction?: string[];
    aero?: string[];
    chassis?: string[];
    cooling?: string[];
  };
  images: string[];
  total_likes: number;
  created_at: string;
}

export default function CarDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [car, setCar] = useState<Car | null>(null);
  const [owner, setOwner] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load car and owner data
  useEffect(() => {
    const loadCarData = async () => {
      try {
        setIsLoading(true);
        const carData = await getCarById(carId);
        if (carData) {
          setCar(carData);
          const ownerData = await getUserById(carData.owner_id);
          setOwner(ownerData);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading car data:", error);
        setIsLoading(false);
      }
    };

    loadCarData();
  }, [carId]);

  const handleBackClick = () => {
    // Since edit page now uses router.replace(), it won't be in history
    // Safe to use normal back navigation
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback to garage if no history
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

  if (!car) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Car Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The car you&apos;re looking for doesn&apos;t exist.
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

  const handleImageError = (imageIndex: number) => {
    setFailedImages((prev) => new Set(prev).add(`${carId}-${imageIndex}`));
  };

  const openModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  const navigateModal = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setModalImageIndex((prev) =>
        prev === 0 ? car.images.length - 1 : prev - 1
      );
    } else {
      setModalImageIndex((prev) =>
        prev === car.images.length - 1 ? 0 : prev + 1
      );
    }
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
                !car.images[currentImageIndex] ? (
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
              {car.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {car.images.map((_, index) => (
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
                      !car.images[index] ? (
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
                              alt={owner.display_name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-medium">
                              {owner.display_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg hover:underline">
                            {owner.display_name}
                          </h3>
                          <p className="text-muted-foreground">
                            @{owner.username}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Member since{" "}
                            {new Date(owner.created_at).toLocaleDateString(
                              "en-NZ",
                              {
                                year: "numeric",
                                month: "long",
                              }
                            )}
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
                      <p className="text-muted-foreground">Brand</p>
                      <p className="font-medium">{car.brand}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Model</p>
                      <p className="font-medium">{car.model}</p>
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
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Engine Code</p>
                        <p className="font-medium">{car.engine.engine_code}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Displacement</p>
                        <p className="font-medium">{car.engine.displacement}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Aspiration</p>
                        <p className="font-medium capitalize">
                          {car.engine.aspiration}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Power (HP)</p>
                        <p className="font-medium">{car.engine.power_hp}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Torque (Nm)</p>
                        <p className="font-medium">{car.engine.torque_nm}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Engine Modifications */}
              {car.engine?.modifications && (
                <Card>
                  <CardHeader>
                    <CardTitle>Engine Modifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {/* Turbo */}
                      {car.engine.modifications.turbo && (
                        <div>
                          <p className="text-muted-foreground">Turbo</p>
                          <p className="font-medium">
                            {car.engine.modifications.turbo.brand}{" "}
                            {car.engine.modifications.turbo.model}
                            {car.engine.modifications.turbo.custom
                              ? " (custom)"
                              : ""}
                          </p>
                        </div>
                      )}
                      {/* Intercooler */}
                      {car.engine.modifications.intercooler && (
                        <div>
                          <p className="text-muted-foreground">Intercooler</p>
                          <p className="font-medium">
                            {car.engine.modifications.intercooler.brand}{" "}
                            {car.engine.modifications.intercooler.model}
                            {car.engine.modifications.intercooler.custom
                              ? " (custom)"
                              : ""}
                          </p>
                        </div>
                      )}
                      {/* Exhaust */}
                      {car.engine.modifications.exhaust && (
                        <div>
                          <p className="text-muted-foreground">Exhaust</p>
                          <p className="font-medium">
                            Header: {car.engine.modifications.exhaust.header}
                            <br />
                            Catback: {car.engine.modifications.exhaust.catback}
                            {car.engine.modifications.exhaust.custom
                              ? " (custom)"
                              : ""}
                          </p>
                        </div>
                      )}
                      {/* Intake */}
                      {car.engine.modifications.intake && (
                        <div>
                          <p className="text-muted-foreground">Intake</p>
                          <p className="font-medium">
                            {car.engine.modifications.intake.brand}{" "}
                            {car.engine.modifications.intake.model}
                            {car.engine.modifications.intake.custom
                              ? " (custom)"
                              : ""}
                          </p>
                        </div>
                      )}
                      {/* ECU */}
                      {car.engine.modifications.ecu && (
                        <div>
                          <p className="text-muted-foreground">ECU</p>
                          <p className="font-medium">
                            {car.engine.modifications.ecu.brand}{" "}
                            {car.engine.modifications.ecu.model}
                            <br />
                            Tuned by: {car.engine.modifications.ecu.tuned_by}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Internals - new row below ECU and above Fuel System */}
                    {car.engine.modifications.internals && (
                      <div>
                        <h4 className="font-medium mb-2">Internals</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {car.engine.modifications.internals.pistons && (
                            <div>
                              <p className="text-muted-foreground">Pistons</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.internals.pistons}
                              </p>
                            </div>
                          )}
                          {car.engine.modifications.internals.rods && (
                            <div>
                              <p className="text-muted-foreground">Rods</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.internals.rods}
                              </p>
                            </div>
                          )}
                          {car.engine.modifications.internals.valves && (
                            <div>
                              <p className="text-muted-foreground">Valves</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.internals.valves}
                              </p>
                            </div>
                          )}
                          {car.engine.modifications.internals.springs && (
                            <div>
                              <p className="text-muted-foreground">Springs</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.internals.springs}
                              </p>
                            </div>
                          )}
                          {car.engine.modifications.internals.cams && (
                            <div>
                              <p className="text-muted-foreground">Cams</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.internals.cams}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Fuel System */}
                    {car.engine.modifications.fuel_system && (
                      <div>
                        <h4 className="font-medium mb-2">Fuel System</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {car.engine.modifications.fuel_system.injectors && (
                            <div>
                              <p className="text-muted-foreground">Injectors</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.fuel_system.injectors}
                              </p>
                            </div>
                          )}
                          {car.engine.modifications.fuel_system.fuel_pump && (
                            <div>
                              <p className="text-muted-foreground">Fuel Pump</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.fuel_system.fuel_pump}
                              </p>
                            </div>
                          )}
                          {car.engine.modifications.fuel_system.fuel_rail && (
                            <div>
                              <p className="text-muted-foreground">Fuel Rail</p>
                              <p className="font-medium capitalize">
                                {car.engine.modifications.fuel_system.fuel_rail}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Brakes */}
              {car.brakes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Brakes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Front Brakes */}
                    {car.brakes.front && (
                      <div>
                        <h4 className="font-medium mb-2">Front Brakes</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {car.brakes.front.caliper && (
                            <div>
                              <p className="text-muted-foreground">Caliper</p>
                              <p className="font-medium capitalize">
                                {car.brakes.front.caliper}
                              </p>
                            </div>
                          )}
                          {car.brakes.front.disc_size && (
                            <div>
                              <p className="text-muted-foreground">Disc Size</p>
                              <p className="font-medium capitalize">
                                {car.brakes.front.disc_size}
                              </p>
                            </div>
                          )}
                          {car.brakes.front.disc_type && (
                            <div>
                              <p className="text-muted-foreground">Disc Type</p>
                              <p className="font-medium capitalize">
                                {car.brakes.front.disc_type}
                              </p>
                            </div>
                          )}
                          {car.brakes.front.pads && (
                            <div>
                              <p className="text-muted-foreground">Pads</p>
                              <p className="font-medium capitalize">
                                {car.brakes.front.pads}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rear Brakes */}
                    {car.brakes.rear && (
                      <div>
                        <h4 className="font-medium mb-2">Rear Brakes</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {car.brakes.rear.caliper && (
                            <div>
                              <p className="text-muted-foreground">Caliper</p>
                              <p className="font-medium capitalize">
                                {car.brakes.rear.caliper}
                              </p>
                            </div>
                          )}
                          {car.brakes.rear.disc_size && (
                            <div>
                              <p className="text-muted-foreground">Disc Size</p>
                              <p className="font-medium capitalize">
                                {car.brakes.rear.disc_size}
                              </p>
                            </div>
                          )}
                          {car.brakes.rear.disc_type && (
                            <div>
                              <p className="text-muted-foreground">Disc Type</p>
                              <p className="font-medium capitalize">
                                {car.brakes.rear.disc_type}
                              </p>
                            </div>
                          )}
                          {car.brakes.rear.pads && (
                            <div>
                              <p className="text-muted-foreground">Pads</p>
                              <p className="font-medium capitalize">
                                {car.brakes.rear.pads}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Other brake details */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {car.brakes.brake_lines && (
                        <div>
                          <p className="text-muted-foreground">Brake Lines</p>
                          <p className="font-medium capitalize">
                            {car.brakes.brake_lines}
                          </p>
                        </div>
                      )}
                      {car.brakes.master_cylinder && (
                        <div>
                          <p className="text-muted-foreground">
                            Master Cylinder
                          </p>
                          <p className="font-medium capitalize">
                            {car.brakes.master_cylinder}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Suspension Details */}
              {car.suspension && (
                <Card>
                  <CardHeader>
                    <CardTitle>Suspension Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Coilover type at top */}
                    {car.suspension_type && (
                      <div>
                        <p className="text-muted-foreground">Suspension Type</p>
                        <p className="font-medium capitalize">
                          {car.suspension_type}
                        </p>
                      </div>
                    )}

                    {/* Front Suspension */}
                    {car.suspension.front && (
                      <div>
                        <h4 className="font-medium mb-2">Front Suspension</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {car.suspension.front.caster && (
                            <div>
                              <p className="text-muted-foreground">Caster</p>
                              <p className="font-medium">
                                {car.suspension.front.caster}
                              </p>
                            </div>
                          )}
                          {car.suspension.front.toe && (
                            <div>
                              <p className="text-muted-foreground">Toe</p>
                              <p className="font-medium">
                                {car.suspension.front.toe}
                              </p>
                            </div>
                          )}
                          {typeof car.suspension.front.camber === "number" && (
                            <div>
                              <p className="text-muted-foreground">Camber</p>
                              <p className="font-medium">
                                {car.suspension.front.camber}&deg;
                              </p>
                            </div>
                          )}
                          {/* Front Anti-roll bar */}
                          {car.suspension.anti_roll_bars?.front && (
                            <div>
                              <p className="text-muted-foreground">
                                Front Anti-Roll Bar
                              </p>
                              <p className="font-medium">
                                {car.suspension.anti_roll_bars.front}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rear Suspension */}
                    {car.suspension.rear && (
                      <div>
                        <h4 className="font-medium mb-2">Rear Suspension</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          {car.suspension.rear.caster && (
                            <div>
                              <p className="text-muted-foreground">Caster</p>
                              <p className="font-medium">
                                {car.suspension.rear.caster}
                              </p>
                            </div>
                          )}
                          {car.suspension.rear.toe && (
                            <div>
                              <p className="text-muted-foreground">Toe</p>
                              <p className="font-medium">
                                {car.suspension.rear.toe}
                              </p>
                            </div>
                          )}
                          {typeof car.suspension.rear.camber === "number" && (
                            <div>
                              <p className="text-muted-foreground">Camber</p>
                              <p className="font-medium">
                                {car.suspension.rear.camber}&deg;
                              </p>
                            </div>
                          )}
                          {/* Rear Anti-roll bar */}
                          {car.suspension.anti_roll_bars?.rear && (
                            <div>
                              <p className="text-muted-foreground">
                                Rear Anti-Roll Bar
                              </p>
                              <p className="font-medium">
                                {car.suspension.anti_roll_bars.rear}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Strut braces */}
                    {car.suspension.strut_braces && (
                      <div>
                        <p className="text-muted-foreground">Strut Braces</p>
                        <p className="font-medium">
                          {car.suspension.strut_braces.join(", ")}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Wheel Specs */}
              {car.wheel_specs &&
                (car.wheel_specs.front || car.wheel_specs.rear) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Wheel Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {car.wheel_specs.front && (
                        <div>
                          <h4 className="font-medium mb-2">Front Wheels</h4>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Brand</p>
                              <p>{car.wheel_specs.front.brand}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p>{car.wheel_specs.front.size}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Offset</p>
                              <p>{car.wheel_specs.front.offset}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {car.wheel_specs.rear && (
                        <div>
                          <h4 className="font-medium mb-2">Rear Wheels</h4>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Brand</p>
                              <p>{car.wheel_specs.rear.brand}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Size</p>
                              <p>{car.wheel_specs.rear.size}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Offset</p>
                              <p>{car.wheel_specs.rear.offset}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              {/* Tire Specs */}
              {car.tire_specs &&
                (car.tire_specs.front || car.tire_specs.rear) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tire Specifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {car.tire_specs.front && (
                          <div>
                            <p className="text-muted-foreground">Front Tires</p>
                            <p className="font-medium">
                              {car.tire_specs.front}
                            </p>
                          </div>
                        )}
                        {car.tire_specs.rear && (
                          <div>
                            <p className="text-muted-foreground">Rear Tires</p>
                            <p className="font-medium">{car.tire_specs.rear}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Exterior Kit Details */}
              {car.exterior && car.exterior.body_kit && (
                <Card>
                  <CardHeader>
                    <CardTitle>Exterior Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {car.exterior.body_kit.front_bumper && (
                        <div>
                          <p className="text-muted-foreground">Front Bumper</p>
                          <p className="font-medium capitalize">
                            {car.exterior.body_kit.front_bumper}
                          </p>
                        </div>
                      )}
                      {car.exterior.body_kit.rear_bumper && (
                        <div>
                          <p className="text-muted-foreground">Rear Bumper</p>
                          <p className="font-medium capitalize">
                            {car.exterior.body_kit.rear_bumper}
                          </p>
                        </div>
                      )}
                      {car.exterior.body_kit.side_skirts && (
                        <div>
                          <p className="text-muted-foreground">Side Skirts</p>
                          <p className="font-medium capitalize">
                            {car.exterior.body_kit.side_skirts}
                          </p>
                        </div>
                      )}
                      {car.exterior.body_kit.rear_wing && (
                        <div>
                          <p className="text-muted-foreground">Rear Wing</p>
                          <p className="font-medium capitalize">
                            {car.exterior.body_kit.rear_wing}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Paint Details */}
                    {car.exterior.paint && (
                      <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                        <div>
                          <p className="text-muted-foreground">Paint Color</p>
                          <p className="font-medium capitalize">
                            {car.exterior.paint.color}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Paint Type</p>
                          <p className="font-medium capitalize">
                            {car.exterior.paint.type}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Finish</p>
                          <p className="font-medium capitalize">
                            {car.exterior.paint.finish}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Lighting Details */}
                    {car.exterior.lighting && (
                      <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                        <div>
                          <p className="text-muted-foreground">Headlights</p>
                          <p className="font-medium capitalize">
                            {car.exterior.lighting.headlights}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taillights</p>
                          <p className="font-medium capitalize">
                            {car.exterior.lighting.taillights}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Indicators</p>
                          <p className="font-medium capitalize">
                            {car.exterior.lighting.indicators}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Interior Details */}
              {car.interior && (
                <Card>
                  <CardHeader>
                    <CardTitle>Interior Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {/* Seats */}
                      {car.interior.seats?.front && (
                        <div>
                          <p className="text-muted-foreground">Front Seats</p>
                          <p className="font-medium capitalize">
                            {car.interior.seats.front}
                          </p>
                        </div>
                      )}
                      {car.interior.seats?.rear && (
                        <div>
                          <p className="text-muted-foreground">Rear Seats</p>
                          <p className="font-medium capitalize">
                            {car.interior.seats.rear}
                          </p>
                        </div>
                      )}
                      {/* Steering Wheel */}
                      {car.interior.steering_wheel && (
                        <div>
                          <p className="text-muted-foreground">
                            Steering Wheel
                          </p>
                          <p className="font-medium capitalize">
                            {car.interior.steering_wheel.brand}{" "}
                            {car.interior.steering_wheel.model} (
                            {car.interior.steering_wheel.size})
                          </p>
                        </div>
                      )}
                      {/* Gauges */}
                      {car.interior.gauges && (
                        <div>
                          <p className="text-muted-foreground">Gauges</p>
                          <p className="font-medium capitalize">
                            {car.interior.gauges}
                          </p>
                        </div>
                      )}
                      {/* Roll Cage */}
                      {car.interior.roll_cage && (
                        <div>
                          <p className="text-muted-foreground">Roll Cage</p>
                          <p className="font-medium capitalize">
                            {car.interior.roll_cage.brand}{" "}
                            {car.interior.roll_cage.points}{" "}
                            {car.interior.roll_cage.material}
                          </p>
                        </div>
                      )}
                      {/* Audio */}
                      {car.interior.audio && (
                        <>
                          <div>
                            <p className="text-muted-foreground">Head Unit</p>
                            <p className="font-medium capitalize">
                              {car.interior.audio.head_unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Speakers</p>
                            <p className="font-medium capitalize">
                              {car.interior.audio.speakers}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Subwoofer</p>
                            <p className="font-medium capitalize">
                              {car.interior.audio.subwoofer}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Modifications */}
              {car.performance_mods && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Modifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {/* Weight Reduction */}
                      {car.performance_mods.weight_reduction && (
                        <div>
                          <p className="text-muted-foreground">
                            Weight Reduction
                          </p>
                          <p className="font-medium capitalize">
                            {car.performance_mods.weight_reduction.map(
                              (item, idx) => (
                                <span key={idx}>
                                  {item}
                                  <br />
                                </span>
                              )
                            )}
                          </p>
                        </div>
                      )}
                      {/* Aero */}
                      {car.performance_mods.aero && (
                        <div>
                          <p className="text-muted-foreground">Aero</p>
                          <p className="font-medium capitalize">
                            {car.performance_mods.aero.map((item, idx) => (
                              <span key={idx}>
                                {item}
                                <br />
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                      {/* Chassis */}
                      {car.performance_mods.chassis && (
                        <div>
                          <p className="text-muted-foreground">Chassis</p>
                          <p className="font-medium capitalize">
                            {car.performance_mods.chassis.map((item, idx) => (
                              <span key={idx}>
                                {item}
                                <br />
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                      {/* Cooling */}
                      {car.performance_mods.cooling && (
                        <div>
                          <p className="text-muted-foreground">Cooling</p>
                          <p className="font-medium capitalize">
                            {car.performance_mods.cooling.map((item, idx) => (
                              <span key={idx}>
                                {item}
                                <br />
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>{car.total_likes} likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span>0 views</span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Added{" "}
                    {new Date(car.created_at).toLocaleDateString("en-NZ", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className="!max-w-none !w-screen !h-screen !p-0 !m-0 !rounded-none bg-background border-none "
            showCloseButton={true}
          >
            <DialogTitle className="sr-only">
              {car.brand} {car.model} Image Gallery
            </DialogTitle>
            <div className="relative w-full h-full flex flex-col">
              {/* Close button using shadcn Button component */}

              {/* Main image area - takes up most of the space */}
              <div className="relative flex-1 flex items-center justify-center p-4 pt-16">
                {/* Navigation arrows */}
                {car.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 "
                      onClick={() => navigateModal("prev")}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                      onClick={() => navigateModal("next")}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Main modal image */}
                <div className="relative w-full h-full">
                  {failedImages.has(`${carId}-${modalImageIndex}`) ||
                  !car.images[modalImageIndex] ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <CarIcon className="h-32 w-32 text-muted-foreground" />
                    </div>
                  ) : (
                    <Image
                      src={car.images[modalImageIndex]}
                      alt={`${car.brand} ${car.model} - Image ${
                        modalImageIndex + 1
                      }`}
                      fill
                      quality={100}
                      className="object-contain"
                      sizes="100vw"
                      onError={() => handleImageError(modalImageIndex)}
                    />
                  )}
                </div>
              </div>

              {/* Bottom thumbnail strip */}
              {car.images.length > 1 && (
                <div className="p-4">
                  <div className="flex justify-center gap-2 max-w-full overflow-x-auto">
                    {car.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setModalImageIndex(index)}
                        className={`relative flex-shrink-0 w-16 h-16 overflow-hidden rounded border-2 transition-colors ${
                          modalImageIndex === index
                            ? "border-white"
                            : "border-transparent hover:border-gray-400"
                        }`}
                      >
                        {failedImages.has(`${carId}-${index}`) ||
                        !car.images[index] ? (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <Image
                            src={car.images[index]}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="64px"
                            onError={() => handleImageError(index)}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Image counter */}
                  <div className="text-center mt-2 text-white/80 text-sm">
                    {modalImageIndex + 1} / {car.images.length}
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
