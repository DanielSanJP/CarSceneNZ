"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Camera } from "lucide-react";
import Image from "next/image";
// import { uploadEventImageAction } from "@/lib/server/upload-actions"; // TODO: Convert to prop

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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Image size should be less than 5MB.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      // Always upload to Supabase storage - use a temp ID if none provided
      const eventId = tempEventId || `temp_${Date.now()}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", eventId);
      formData.append("isTemp", "true");

      // TODO: Convert to server action prop
      // const result = await uploadEventImageAction(formData);
      const result = await uploadAction(formData);

      if (result.url) {
        onImageChange(result.url);
      } else {
        alert(result.error || "Failed to upload image. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
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
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center max-w-md mx-auto">
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
        <div className="flex items-center gap-4">
          <Input
            id="event-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="cursor-pointer"
            disabled={isLoading || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            disabled={isLoading || isUploading}
          >
            <label htmlFor="event-image-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Choose Image"}
            </label>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Upload a square poster image (recommended: 1080x1080px). Max file
          size: 5MB.
          {tempEventId
            ? " Images are uploaded immediately to secure storage."
            : ""}
        </p>
      </div>
    </div>
  );
}
