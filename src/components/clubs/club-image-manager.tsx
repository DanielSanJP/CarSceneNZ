"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Users } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { compressImageForUpload } from "@/lib/utils/image-compression";

interface ClubImageManagerProps {
  currentImage?: string;
  onImageChange: (imageUrl: string, tempClubId?: string) => void;
  isLoading?: boolean;
  clubId?: string;
  tempClubId?: string;
  isTemp?: boolean;
  uploadAction: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
  showPreviewOverlay?: boolean;
  clubName?: string;
  clubLocation?: string;
}

export function ClubImageManager({
  currentImage,
  onImageChange,
  isLoading = false,
  clubId,
  tempClubId,
  isTemp = false,
  uploadAction,
  showPreviewOverlay = false,
  clubName,
  clubLocation,
}: ClubImageManagerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    try {
      // Reset compression state
      setIsCompressing(true);

      // Compress image
      const compressionResult = await compressImageForUpload(file, "club");

      setIsCompressing(false);
      setIsUploading(true);

      // Create FormData for server action
      const formData = new FormData();
      formData.append("file", compressionResult.file);
      formData.append("clubId", clubId || tempClubId || "");
      formData.append("isTemp", isTemp.toString());

      const result = await uploadAction(formData);

      if (result.url) {
        onImageChange(result.url, isTemp ? tempClubId || undefined : undefined);
        setImageError(false);
      } else {
        toast.error(
          result.error || "Failed to upload image. Please try again."
        );
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process and upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setIsCompressing(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Image Preview */}
      <div className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden max-w-md mx-auto">
        {currentImage && !imageError ? (
          <div className="relative h-full">
            <Image
              src={currentImage}
              alt="Club logo preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              quality={75}
              onError={handleImageError}
            />
            {/* Optional overlay for preview */}
            {showPreviewOverlay && (
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold">
                  {clubName || "Your Club Name"}
                </h3>
                <p className="text-sm opacity-90">
                  {clubLocation || "Location"}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Club logo preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="space-y-2 max-w-md mx-auto">
        <Label htmlFor="club-image-upload">
          Upload Club Logo {currentImage ? "(Replace)" : ""}
        </Label>

        {/* Upload Controls */}
        <div className="flex justify-start">
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            disabled={isLoading || isCompressing || isUploading}
          >
            <label htmlFor="club-image-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {isCompressing
                ? "Compressing..."
                : isUploading
                ? "Uploading..."
                : currentImage
                ? "Replace Image"
                : "Choose Image"}
            </label>
          </Button>
          <Input
            id="club-image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isLoading || isCompressing || isUploading}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Recommended size: 400px × 400px (square). This will be the logo image
          for your club card.
        </p>
      </div>
    </div>
  );
}
