"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getCarById, getUserById } from "@/data";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading...</h1>
            <p className="text-muted-foreground mt-2">Loading car details...</p>
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
    if (!car.images) return;
    if (direction === "prev") {
      setModalImageIndex((prev) =>
        prev === 0 ? car.images!.length - 1 : prev - 1
      );
    } else {
      setModalImageIndex((prev) =>
        prev === car.images!.length - 1 ? 0 : prev + 1
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
                !car.images ||
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
              {car.images && car.images.length > 1 && (
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
                      !car.images![index] ? (
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          <CarIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <Image
                          src={car.images![index]}
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
                          <Image
                            src={owner.profile_image_url || ""}
                            alt={owner.username}
                            fill
                            className="object-cover"
                            sizes="64px"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {owner.display_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
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
                        <p className="font-medium">
                          {String(car.engine.engine_code)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Displacement</p>
                        <p className="font-medium">
                          {String(car.engine.displacement)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Aspiration</p>
                        <p className="font-medium capitalize">
                          {String(car.engine.aspiration)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Power (HP)</p>
                        <p className="font-medium">
                          {String(car.engine.power_hp)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Torque (NM)</p>
                        <p className="font-medium">
                          {String(car.engine.torque_nm)}
                        </p>
                      </div>
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
                      <span>{car.total_likes || 0} likes</span>
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
            className="!max-w-none !w-screen !h-screen !p-0 !m-0 !rounded-none bg-background border-none"
            showCloseButton={true}
          >
            <DialogTitle className="sr-only">
              {car.brand} {car.model} Image Gallery
            </DialogTitle>
            <div className="relative w-full h-full flex flex-col">
              {/* Main image area */}
              <div className="relative flex-1 flex items-center justify-center p-4 pt-16">
                {/* Navigation arrows */}
                {car.images && car.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
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
                  !car.images ||
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
              {car.images && car.images.length > 1 && (
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
                        {car.images && !car.images![index] ? (
                          <div className="w-16 h-16 bg-muted flex items-center justify-center">
                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ) : (
                          <Image
                            src={car.images![index]}
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
