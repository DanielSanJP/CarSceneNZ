import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Car as CarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Car } from "@/types/car";

interface CarImageGalleryProps {
  car: Car;
}

export function CarImageGallery({ car }: CarImageGalleryProps) {
  // UI state
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const handleImageError = (imageIndex: number) => {
    setFailedImages((prev) => new Set(prev).add(`${car.id}-${imageIndex}`));
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

  return (
    <>
      <div className="space-y-4">
        <div
          className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
          onClick={() => openModal(currentImageIndex)}
        >
          {failedImages.has(`${car.id}-${currentImageIndex}`) ||
          !car.images?.[currentImageIndex] ? (
            <div className="aspect-square bg-muted flex items-center justify-center"></div>
          ) : (
            <Image
              src={car.images[currentImageIndex]}
              alt={`${car.brand} ${car.model} - Image ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={100}
              priority={true}
              unoptimized={false}
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
                {failedImages.has(`${car.id}-${index}`) ||
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={100}
                    priority={true}
                    unoptimized={false}
                    onError={() => handleImageError(index)}
                  />
                )}
              </button>
            ))}
          </div>
        )}
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  quality={100}
                  priority={true}
                  unoptimized={false}
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
    </>
  );
}
