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
  // Just filter out empty URLs - that's it!
  const imageUrls = (car.images || []).filter(
    (url) => url && url.trim() !== ""
  );

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // No images? Show placeholder
  if (imageUrls.length === 0) {
    return (
      <div className="w-full aspect-square bg-muted flex items-center justify-center rounded-lg">
        <CarIcon className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  const openModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  const navigateModal = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setModalImageIndex((prev) =>
        prev === 0 ? imageUrls.length - 1 : prev - 1
      );
    } else {
      setModalImageIndex((prev) =>
        prev === imageUrls.length - 1 ? 0 : prev + 1
      );
    }
  };

  return (
    <>
      <div className="w-full space-y-4">
        {/* Main image */}
        <div
          className="w-full aspect-square relative rounded-lg overflow-hidden cursor-pointer bg-muted"
          onClick={() => openModal(currentImageIndex)}
        >
          <Image
            src={imageUrls[currentImageIndex]}
            alt={`${car.brand} ${car.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Thumbnails */}
        {imageUrls.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                title={`View image ${index + 1}`}
                className={`aspect-square relative rounded overflow-hidden border-2 ${
                  currentImageIndex === index
                    ? "border-primary"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-Screen Image Modal */}
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
              <Image
                src={imageUrls[modalImageIndex]}
                alt={`${car.brand} ${car.model} - Image ${modalImageIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={75}
                priority={true}
              />

              {/* Navigation buttons */}
              {imageUrls.length > 1 && (
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
            {imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1">
                <div className="text-center text-sm">
                  {modalImageIndex + 1} / {imageUrls.length}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
