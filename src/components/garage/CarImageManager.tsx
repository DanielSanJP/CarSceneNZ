"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, X, GripVertical } from "lucide-react";
import Image from "next/image";
import {
  uploadCarImages,
  preUploadCarImages,
  generateTempCarId,
} from "@/lib/utils/upload-car-images";

interface CarImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  isLoading?: boolean;
  carId?: string; // Optional - only provided for existing cars
  tempCarId?: string; // For new cars - temp ID for pre-upload
  onTempCarIdChange?: (tempCarId: string) => void; // Callback to set temp car ID
}

export default function CarImageManager({
  images,
  onChange,
  isLoading,
  carId,
  tempCarId,
  onTempCarIdChange,
}: CarImageManagerProps) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const handleDeleteImage = (imageUrl: string) => {
    const newImages = images.filter((img) => img !== imageUrl);
    onChange(newImages);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImageCount = images.length;
    const maxImages = 10;
    const remainingSlots = maxImages - currentImageCount;

    if (remainingSlots <= 0) {
      alert(`You can only upload a maximum of ${maxImages} images.`);
      e.target.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      alert(
        `You can only add ${remainingSlots} more image(s). Only the first ${remainingSlots} image(s) will be uploaded.`
      );
    }

    if (carId) {
      // For existing cars, upload immediately to Supabase
      setIsUploading(true);
      try {
        const uploadedUrls = await uploadCarImages(filesToProcess, carId);
        if (uploadedUrls.length > 0) {
          onChange([...images, ...uploadedUrls]);
        }
      } catch (error) {
        console.error("Error uploading images:", error);
        alert("Failed to upload images. Please try again.");
      } finally {
        setIsUploading(false);
      }
    } else {
      // For new cars, also upload immediately to temp folder
      setIsUploading(true);
      try {
        // Generate temp car ID if not provided
        let currentTempId = tempCarId;
        if (!currentTempId) {
          currentTempId = generateTempCarId();
          onTempCarIdChange?.(currentTempId);
        }

        const uploadedUrls = await preUploadCarImages(
          filesToProcess,
          currentTempId
        );
        if (uploadedUrls.length > 0) {
          onChange([...images, ...uploadedUrls]);
        }
      } catch (error) {
        console.error("Error pre-uploading images:", error);
        alert("Failed to upload images. Please try again.");
      } finally {
        setIsUploading(false);
      }
    }

    // Clear the input
    e.target.value = "";
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];

    // Remove the dragged image from its original position
    newImages.splice(draggedIndex, 1);

    // Insert it at the new position
    newImages.splice(dropIndex, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Car Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Images */}
        {images.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className={`relative group overflow-hidden rounded-lg border cursor-move transition-all ${
                  draggedIndex === index
                    ? "opacity-50 scale-95 rotate-2"
                    : "hover:shadow-lg"
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
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
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={() => handleImageError(imageUrl)}
                    />
                  )}

                  {/* Drag handle */}
                  <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  {/* Delete button */}
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(imageUrl)}
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
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No images uploaded yet
            </p>
          </div>
        )}

        {/* Upload new images */}
        <div className="space-y-2">
          <Label htmlFor="image-upload">Add Images ({images.length}/10)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="cursor-pointer"
              disabled={images.length >= 10 || isLoading || isUploading}
            />
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
          </div>
          {images.length >= 10 && (
            <p className="text-sm text-muted-foreground">
              Maximum of 10 images allowed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
