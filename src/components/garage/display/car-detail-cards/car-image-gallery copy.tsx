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
  // Clean and validate images array
  const validImages = (car.images || []).filter(
    (img) => img && img.trim() !== "" && !img.includes("_2.blob")
  );

  // UI state
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Early return if no valid images - after hooks
  if (validImages.length === 0) {
    return (
      <div className="aspect-square bg-muted flex items-center justify-center rounded-lg">
        <CarIcon className="h-16 w-16 text-muted-foreground" />
        <span className="text-sm text-muted-foreground ml-2">
          No images available
        </span>
      </div>
    );
  }

  const handleImageError = (imageIndex: number) => {
    setFailedImages((prev) => new Set(prev).add(`${car.id}-${imageIndex}`));
  };

  const openModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  const navigateModal = (direction: "prev" | "next") => {
    const imageLength = validImages.length;
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
          !validImages[currentImageIndex] ? (
            <div className="aspect-square bg-muted flex items-center justify-center">
              <CarIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={validImages[currentImageIndex]}
              alt={`${car.brand} ${car.model} - Image ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              quality={75}
              priority={true}
              onError={() => handleImageError(currentImageIndex)}
            />
          )}
        </div>

        {/* Image thumbnails */}
        {validImages.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {validImages.map((imageUrl, index) => (
              <button
                key={`${car.id}-thumb-${index}`}
                onClick={() => setCurrentImageIndex(index)}
                className={`relative aspect-square overflow-hidden rounded border-2 transition-colors ${
                  currentImageIndex === index
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground"
                }`}
              >
                {failedImages.has(`${car.id}-${index}`) ? (
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <CarIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <Image
                    src={imageUrl}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 25vw, 15vw"
                    quality={75}
                    priority={index < 4}
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
              {validImages[modalImageIndex] && (
                <Image
                  src={validImages[modalImageIndex]}
                  alt={`${car.brand} ${car.model} - Image ${
                    modalImageIndex + 1
                  }`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  quality={75}
                  priority={true}
                />
              )}

              {/* Navigation buttons */}
              {validImages.length > 1 && (
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
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="text-center text-sm">
                  {modalImageIndex + 1} / {validImages.length}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
