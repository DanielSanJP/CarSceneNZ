"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Camera, Upload, X, ArrowUpDown, GripVertical } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { compressMultipleImagesForUpload } from "@/lib/utils/image-compression";
import { deleteCarImageAction } from "@/lib/actions/delete-actions";
import { ImageReorganizeModal } from "./ImageReorganizeModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Simple temp ID generator for client-side use
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Presentational Image Item (for DragOverlay)
interface ImageItemProps {
  imageUrl: string;
  index: number;
  failedImages: Set<string>;
  onImageError: (imageUrl: string) => void;
  onDeleteImage: (imageUrl: string) => void;
  isDragOverlay?: boolean;
}

const ImageItem = React.forwardRef<HTMLDivElement, ImageItemProps>(
  (
    {
      imageUrl,
      index,
      failedImages,
      onImageError,
      onDeleteImage,
      isDragOverlay = false,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          relative group overflow-hidden rounded-lg border bg-background transition-all duration-200
          ${
            isDragOverlay
              ? "shadow-2xl scale-105 rotate-2 border-primary"
              : "hover:border-muted-foreground"
          }
        `}
      >
        <div className="relative aspect-square">
          {failedImages.has(imageUrl) ? (
            <div className="aspect-square bg-muted flex items-center justify-center">
              <Camera className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt={`Car image ${index + 1}`}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => onImageError(imageUrl)}
              draggable={false}
            />
          )}

          {/* Drag handle */}
          {!isDragOverlay && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4" />
            </div>
          )}

          {/* Delete button */}
          {!isDragOverlay && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-8 w-8 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteImage(imageUrl);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Main image indicator */}
          {index === 0 && (
            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium shadow-sm">
              Main Image
            </div>
          )}

          {/* Image number */}
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-xs font-medium">
            {index + 1}
          </div>
        </div>
      </div>
    );
  }
);

ImageItem.displayName = "ImageItem";

// Sortable Image Item Component
interface SortableImageItemProps {
  imageUrl: string;
  index: number;
  failedImages: Set<string>;
  onImageError: (imageUrl: string) => void;
  onDeleteImage: (imageUrl: string) => void;
}

function SortableImageItem({
  imageUrl,
  index,
  failedImages,
  onImageError,
  onDeleteImage,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: imageUrl,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide the original item when dragging (DragOverlay will show the dragged item)
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
    >
      <div {...listeners} className="w-full h-full">
        <ImageItem
          imageUrl={imageUrl}
          index={index}
          failedImages={failedImages}
          onImageError={onImageError}
          onDeleteImage={onDeleteImage}
        />
      </div>
    </div>
  );
}

// Mobile Draggable Image Item Component
interface MobileDraggableImageItemProps {
  imageUrl: string;
  index: number;
  totalImages: number;
  failedImages: Set<string>;
  isLoading?: boolean;
  onImageError: (imageUrl: string) => void;
  onDeleteImage: (imageUrl: string) => void;
}

function MobileDraggableImageItem({
  imageUrl,
  index,
  totalImages,
  failedImages,
  isLoading,
  onImageError,
  onDeleteImage,
}: MobileDraggableImageItemProps) {
  return (
    <CarouselItem key={index}>
      <div className="relative group overflow-hidden rounded-lg border">
        <div className="relative aspect-square">
          {failedImages.has(imageUrl) ? (
            <div className="aspect-square bg-muted flex items-center justify-center">
              <Camera className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            <Image
              src={imageUrl}
              alt={`Car image ${index + 1}`}
              fill
              className="object-cover"
              sizes="100vw"
              onError={() => onImageError(imageUrl)}
            />
          )}

          {/* Carousel Navigation */}
          {totalImages > 1 && (
            <>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 backdrop-blur-sm border-none hover:bg-black/70" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 backdrop-blur-sm border-none hover:bg-black/70" />
            </>
          )}

          {/* Delete button */}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => onDeleteImage(imageUrl)}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Main image indicator */}
          {index === 0 && (
            <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
              Main Image
            </div>
          )}

          {/* Image number */}
          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
            {index + 1} / {totalImages}
          </div>
        </div>
      </div>
    </CarouselItem>
  );
}

// Utility function to clean up image URLs and remove duplicates
function cleanImageArray(images: string[]): string[] {
  const cleanedImages: string[] = [];
  const seenBaseUrls = new Set<string>();

  for (let i = images.length - 1; i >= 0; i--) {
    const imageUrl = images[i];
    if (!imageUrl) continue;

    const baseUrl = imageUrl.split("?v=")[0];

    if (!seenBaseUrls.has(baseUrl)) {
      seenBaseUrls.add(baseUrl);
      cleanedImages.unshift(imageUrl);
    }
  }

  return cleanedImages;
}

interface CarImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  isLoading?: boolean;
  carId?: string;
  tempCarId?: string;
  onTempCarIdChange?: (tempCarId: string) => void;
  uploadAction: (
    formData: FormData
  ) => Promise<{ urls: string[]; error: string | null }>;
}

export default function CarImageManager({
  images,
  onChange,
  isLoading,
  carId,
  tempCarId,
  onTempCarIdChange,
  uploadAction,
}: CarImageManagerProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [isReorganizeOpen, setIsReorganizeOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration issues with @dnd-kit by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Optimized @dnd-kit sensors with better activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Require 10px movement before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((image) => image === active.id);
      const newIndex = images.findIndex((image) => image === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      onChange(newImages);
    }

    setActiveId(null);
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const newImages = images.filter((img) => img !== imageUrl);
      onChange(newImages);

      if (carId && !imageUrl.includes("temp_")) {
        console.log("🗑️ Deleting image from storage:", imageUrl);

        const result = await deleteCarImageAction(imageUrl);

        if (result.success) {
        } else {
          console.error(
            "❌ Failed to delete image from storage:",
            result.error
          );
          toast.warning("Image removed from gallery, but file cleanup failed");
        }
      } else {
        console.log("🗑️ Removing temp/new image from array:", imageUrl);
      }
    } catch (error) {
      console.error("❌ Error removing image:", error);
      toast.error("Failed to remove image");
      onChange(images);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImageCount = images.length;
    const maxImages = 10;
    const remainingSlots = maxImages - currentImageCount;
    if (remainingSlots <= 0) {
      toast.error(`You can only upload a maximum of ${maxImages} images.`);
      e.target.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.warning(
        `You can only add ${remainingSlots} more image(s). Only the first ${remainingSlots} image(s) will be uploaded.`
      );
    }

    try {
      setIsUploading(true);

      const compressionResults = await compressMultipleImagesForUpload(
        filesToProcess,
        "car"
      );

      // Compression stats tracking (commented out until needed)
      // const totalOriginalSize = compressionResults.reduce(
      //   (sum, result) => sum + result.originalSize,
      //   0
      // );
      // const totalCompressedSize = compressionResults.reduce(
      //   (sum, result) => sum + result.compressedSize,
      //   0
      // );
      // const totalSavings = totalOriginalSize - totalCompressedSize;
      // const totalSavingsPercent = Math.round((totalSavings / totalOriginalSize) * 100);

      if (carId) {
        const formData = new FormData();
        compressionResults.forEach((result) =>
          formData.append("files", result.file)
        );
        formData.append("carId", carId);
        formData.append("isTemp", "false");
        formData.append("existingImageCount", images.length.toString());

        const result = await uploadAction(formData);
        if (result.urls.length > 0) {
          const newImages = cleanImageArray([...images, ...result.urls]);
          onChange(newImages);
          toast.success(
            `${result.urls.length} image(s) uploaded successfully!`
          );
        } else if (result.error) {
          throw new Error(result.error);
        }
      } else {
        let currentTempId = tempCarId;
        if (!currentTempId) {
          currentTempId = generateTempId();
          onTempCarIdChange?.(currentTempId);
        }

        const formData = new FormData();
        compressionResults.forEach((result) =>
          formData.append("files", result.file)
        );
        formData.append("carId", currentTempId);
        formData.append("isTemp", "true");
        formData.append("existingImageCount", images.length.toString());

        const result = await uploadAction(formData);
        if (result.urls.length > 0) {
          const newImages = cleanImageArray([...images, ...result.urls]);
          onChange(newImages);
          toast.success(
            `${result.urls.length} image(s) uploaded successfully!`
          );
        } else if (result.error) {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to process and upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }

    e.target.value = "";
  };

  const openReorganizeModal = () => {
    setIsReorganizeOpen(true);
  };

  const handleApplyReorganization = (reorderedImages: string[]) => {
    onChange(reorderedImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Car Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Images */}
        {images.length > 0 ? (
          <>
            {/* Mobile Carousel */}
            <div className="md:hidden">
              <Carousel className="w-full max-w-sm mx-auto">
                <CarouselContent>
                  {images.map((imageUrl, index) => (
                    <MobileDraggableImageItem
                      key={imageUrl}
                      imageUrl={imageUrl}
                      index={index}
                      totalImages={images.length}
                      failedImages={failedImages}
                      isLoading={isLoading}
                      onImageError={handleImageError}
                      onDeleteImage={handleDeleteImage}
                    />
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Desktop Grid with Drag and Drop */}
            <div className="hidden md:block space-y-4">
              {mounted ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={images}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {images.map((imageUrl, index) => (
                        <SortableImageItem
                          key={imageUrl}
                          imageUrl={imageUrl}
                          index={index}
                          failedImages={failedImages}
                          onImageError={handleImageError}
                          onDeleteImage={handleDeleteImage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay adjustScale={false}>
                    {activeId ? (
                      <ImageItem
                        imageUrl={activeId}
                        index={images.indexOf(activeId)}
                        failedImages={failedImages}
                        onImageError={handleImageError}
                        onDeleteImage={handleDeleteImage}
                        isDragOverlay
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                // Static grid for SSR/before client mount - prevents hydration issues
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {images.map((imageUrl, index) => (
                    <div key={imageUrl}>
                      <ImageItem
                        imageUrl={imageUrl}
                        index={index}
                        failedImages={failedImages}
                        onImageError={handleImageError}
                        onDeleteImage={handleDeleteImage}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center max-w-md mx-auto aspect-square flex flex-col items-center justify-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No images uploaded yet
            </p>
          </div>
        )}

        {/* Upload new images */}
        <div className="space-y-2 max-w-md mx-auto">
          <Label htmlFor="image-upload">Add Images ({images.length}/10)</Label>

          <div className="flex gap-2 justify-start">
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              disabled={images.length >= 10 || isLoading || isUploading}
            >
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Choose Files"}
              </label>
            </Button>

            {/* Reorganize Images Button - Available on all devices */}
            {images.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openReorganizeModal}
                disabled={isLoading || isUploading}
                className="gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Reorganize
              </Button>
            )}

            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={images.length >= 10 || isLoading || isUploading}
            />
          </div>
          {images.length >= 10 && (
            <p className="text-sm text-muted-foreground">
              Maximum of 10 images allowed
            </p>
          )}
        </div>
      </CardContent>

      {/* Image Reorganize Modal */}
      <ImageReorganizeModal
        isOpen={isReorganizeOpen}
        onOpenChange={setIsReorganizeOpen}
        images={images}
        onApply={handleApplyReorganization}
        failedImages={failedImages}
        onImageError={handleImageError}
        isLoading={isLoading}
      />
    </Card>
  );
}
