"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/nav";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Upload, X, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface WheelSpec {
  brand: string;
  size: string;
  offset: string;
}

interface CarFormData {
  brand: string;
  model: string;
  year: number | "";
  suspension_type: string;
  is_main_car: boolean;
  is_public: boolean;
  wheel_specs: {
    front: WheelSpec;
    rear: WheelSpec;
  };
  tire_specs: {
    front: string;
    rear: string;
  };
  images: string[];
}

export default function CreateCarPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState<CarFormData>({
    brand: "",
    model: "",
    year: "",
    suspension_type: "",
    is_main_car: false,
    is_public: true,
    wheel_specs: {
      front: { brand: "", size: "", offset: "" },
      rear: { brand: "", size: "", offset: "" },
    },
    tire_specs: {
      front: "",
      rear: "",
    },
    images: [],
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">
              Please log in to add cars to your garage.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWheelSpecChange = (
    position: "front" | "rear",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      wheel_specs: {
        ...prev.wheel_specs,
        [position]: {
          ...prev.wheel_specs[position],
          [field]: value,
        },
      },
    }));
  };

  const handleTireSpecChange = (position: "front" | "rear", value: string) => {
    setFormData((prev) => ({
      ...prev,
      tire_specs: {
        ...prev.tire_specs,
        [position]: value,
      },
    }));
  };

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const handleDeleteImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageUrl),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImageCount = formData.images.length;
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

    // In a real app, you would upload these files to your server/cloud storage
    // For now, we'll simulate adding them as URLs
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData((prev) => {
          // Double-check we don't exceed the limit
          if (prev.images.length >= maxImages) {
            return prev;
          }
          return {
            ...prev,
            images: [...prev.images, imageUrl],
          };
        });
      };
      reader.readAsDataURL(file);
    });

    // Clear the input
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, this would be an API call
      // For now, we'll just simulate saving and redirect
      console.log("Creating car:", formData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to garage
      router.push("/garage");
    } catch (error) {
      console.error("Error creating car:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/garage">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Add New Car</h1>
              <p className="text-muted-foreground">
                Add a new car to your garage and share your build
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Car Images */}
            <Card>
              <CardHeader>
                <CardTitle>Car Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Images */}
                {formData.images.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {formData.images.map((imageUrl, index) => (
                      <div
                        key={index}
                        className="relative group overflow-hidden rounded-lg border"
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
                          {/* Delete button */}
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteImage(imageUrl)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          {/* Main image indicator */}
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                              Main
                            </div>
                          )}
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
                  <Label htmlFor="image-upload">
                    Add Images ({formData.images.length}/10)
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                      disabled={formData.images.length >= 10}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={formData.images.length >= 10}
                    >
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Files
                      </label>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can upload up to 10 images. The first image will be used
                    as the main image.
                    {formData.images.length >= 10 && " Maximum images reached."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                      placeholder="e.g., Toyota, Honda, Mazda"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) =>
                        handleInputChange("model", e.target.value)
                      }
                      placeholder="e.g., Supra, Civic, RX-7"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) =>
                        handleInputChange("year", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suspension">Suspension Type</Label>
                  <Select
                    value={formData.suspension_type}
                    onValueChange={(value) =>
                      handleInputChange("suspension_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select suspension type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air suspension">
                        Air Suspension
                      </SelectItem>
                      <SelectItem value="coilovers">Coilovers</SelectItem>
                      <SelectItem value="lowering springs">
                        Lowering Springs
                      </SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Wheel Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Wheel Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Front Wheels */}
                <div>
                  <h4 className="font-medium mb-3">Front Wheels</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={formData.wheel_specs.front.brand}
                        onChange={(e) =>
                          handleWheelSpecChange(
                            "front",
                            "brand",
                            e.target.value
                          )
                        }
                        placeholder="e.g., Rays, Work, BBS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input
                        value={formData.wheel_specs.front.size}
                        onChange={(e) =>
                          handleWheelSpecChange("front", "size", e.target.value)
                        }
                        placeholder="e.g., 18x9.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset</Label>
                      <Input
                        value={formData.wheel_specs.front.offset}
                        onChange={(e) =>
                          handleWheelSpecChange(
                            "front",
                            "offset",
                            e.target.value
                          )
                        }
                        placeholder="e.g., +22"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Rear Wheels */}
                <div>
                  <h4 className="font-medium mb-3">Rear Wheels</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={formData.wheel_specs.rear.brand}
                        onChange={(e) =>
                          handleWheelSpecChange("rear", "brand", e.target.value)
                        }
                        placeholder="e.g., Rays, Work, BBS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Input
                        value={formData.wheel_specs.rear.size}
                        onChange={(e) =>
                          handleWheelSpecChange("rear", "size", e.target.value)
                        }
                        placeholder="e.g., 18x10.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Offset</Label>
                      <Input
                        value={formData.wheel_specs.rear.offset}
                        onChange={(e) =>
                          handleWheelSpecChange(
                            "rear",
                            "offset",
                            e.target.value
                          )
                        }
                        placeholder="e.g., +15"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tire Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Tire Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="front-tires">Front Tires</Label>
                    <Input
                      id="front-tires"
                      value={formData.tire_specs.front}
                      onChange={(e) =>
                        handleTireSpecChange("front", e.target.value)
                      }
                      placeholder="e.g., 265/35R18"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rear-tires">Rear Tires</Label>
                    <Input
                      id="rear-tires"
                      value={formData.tire_specs.rear}
                      onChange={(e) =>
                        handleTireSpecChange("rear", e.target.value)
                      }
                      placeholder="e.g., 295/30R18"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Car Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Main Car</Label>
                    <p className="text-sm text-muted-foreground">
                      Set this as your main car for leaderboards
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_main_car}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_main_car", checked)
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Public Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see this car in your profile
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_public", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Link href="/garage">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Car
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
