"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Camera } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  compressImageForUpload,
  formatFileSize,
  validateImageFile,
} from "@/lib/utils/image-compression";

interface EventImageManagerProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
  isLoading?: boolean;
  tempEventId?: string;
  uploadAction: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
}

export function EventImageManager({
  currentImage,
  onImageChange,
  onImageRemove,
  isLoading = false,
  tempEventId,
  uploadAction,
}: EventImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const handleDeleteImage = () => {
    if (currentImage) {
      setFailedImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentImage);
        return newSet;
      });
    }
    onImageRemove();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file before compression
    if (!validateImageFile(file)) {
      toast.error("Please select a valid image file (max 50MB).");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      // Compress the image first
      const compressionResult = await compressImageForUpload(file, "event");

      // Show compression info
      const savings = (
        ((compressionResult.originalSize - compressionResult.compressedSize) /
          compressionResult.originalSize) *
        100
      ).toFixed(1);
      // Image compressed successfully
      console.log(
        `Compressed from ${formatFileSize(
          compressionResult.originalSize
        )} to ${formatFileSize(
          compressionResult.compressedSize
        )} (${savings}% smaller)`
      );

      // Always upload to Supabase storage - use a temp ID if none provided
      const eventId = tempEventId || `temp_${Date.now()}`;

      const formData = new FormData();
      formData.append("file", compressionResult.file);
      formData.append("eventId", eventId);
      formData.append("isTemp", "true");

      const result = await uploadAction(formData);
      if (result.url) {
        onImageChange(result.url);
      } else {
        toast.error(
          result.error || "Failed to upload image. Please try again."
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process image.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {currentImage ? (
        <div className="max-w-md mx-auto">
          <div className="relative group overflow-hidden rounded-lg border">
            <div className="relative aspect-square">
              {failedImages.has(currentImage) ? (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              ) : (
                <Image
                  src={currentImage}
                  alt="Event poster"
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onError={() => handleImageError(currentImage)}
                />
              )}

              {/* Delete button */}
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDeleteImage}
                disabled={isLoading || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center max-w-md mx-auto aspect-square flex flex-col items-center justify-center">
          <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No poster image uploaded yet
          </p>
        </div>
      )}

      {/* Upload Controls */}
      <div className="space-y-2 max-w-md mx-auto">
        <Label htmlFor="event-image-upload">
          Event Poster {currentImage ? "(Replace)" : ""}
        </Label>

        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            disabled={isLoading || isUploading}
          >
            <label htmlFor="event-image-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading
                ? "Uploading..."
                : currentImage
                ? "Replace Image"
                : "Choose Image"}
            </label>
          </Button>
          <Input
            id="event-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isLoading || isUploading}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We recommend a square format image of 400px x 400px.
        </p>
      </div>
    </div>
  );
}
