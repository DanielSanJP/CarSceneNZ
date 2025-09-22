"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@/types/user";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Users, Shield, Globe, Lock, MapPin, Star } from "lucide-react";
import { ClubImageManager } from "../club-image-manager";

// import {
//   uploadClubImageForCreation,
//   generateTempClubId,
// } from "@/lib/utils/image-upload"; // TODO: Convert to server action

// Simple temp ID generator for client-side use
function generateTempClubId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface ClubFormData {
  name: string;
  description: string;
  location: string;
  club_type: "open" | "invite" | "closed";
  banner_image: string;
  tempClubId?: string; // For tracking temp uploads
}

const NZ_LOCATIONS = [
  "Auckland",
  "Wellington",
  "Christchurch",
  "Hamilton",
  "Tauranga",
  "Dunedin",
  "Palmerston North",
  "Napier",
  "Nelson",
  "Rotorua",
  "New Plymouth",
  "Whangarei",
  "Invercargill",
];

interface CreateClubFormProps {
  user?: User;
  action?: (formData: FormData) => Promise<void>;
  onSuccess?: () => void;
  embedded?: boolean;
  uploadAction?: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
}

export function CreateClubForm({
  user,
  action,
  onSuccess,
  uploadAction,
}: CreateClubFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<ClubFormData>({
    name: "",
    description: "",
    location: "",
    club_type: "open",
    banner_image: "",
    tempClubId: undefined,
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
        <p className="text-muted-foreground mb-6">
          Please log in to create a club.
        </p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: ClubFormData) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (imageUrl: string, tempClubId?: string) => {
    setFormData((prev: ClubFormData) => ({
      ...prev,
      banner_image: imageUrl,
      tempClubId: tempClubId || prev.tempClubId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Club name is required");
      return;
    }

    if (!formData.description.trim()) {
      alert("Club description is required");
      return;
    }

    if (!formData.location) {
      alert("Please select a location");
      return;
    }

    setIsLoading(true);

    try {
      if (action) {
        // Use server action when provided
        console.log("Starting club creation...", formData);

        const formDataObj = new FormData();
        formDataObj.append("name", formData.name);
        formDataObj.append("description", formData.description);
        formDataObj.append("location", formData.location);
        formDataObj.append("club_type", formData.club_type);
        formDataObj.append("banner_image", formData.banner_image);

        // Add temp club ID if image was pre-uploaded
        if (formData.tempClubId) {
          formDataObj.append("tempClubId", formData.tempClubId);
          console.log("Including temp club ID:", formData.tempClubId);
        }

        console.log("Calling server action...");
        await action(formDataObj);
        console.log("Server action completed successfully");
      } else {
        // Fallback for embedded mode or when no action provided
        const clubData = {
          ...formData,
          id: `club-${Date.now()}`,
          leader_id: user?.id || "",
          total_likes: 0,
          created_at: new Date().toISOString(),
        };

        console.log("Creating club:", clubData);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Call success callback if provided, otherwise redirect
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/clubs?tab=myclub");
        }
      }
    } catch (error) {
      // Check if this is a Next.js redirect (expected behavior)
      if (
        error &&
        typeof error === "object" &&
        ("digest" in error || error.constructor.name === "RedirectError")
      ) {
        // This is a redirect, which is expected - don't show error
        console.log("Redirect detected - club creation successful");
        return;
      }

      console.error("Error creating club:", error);
      alert("Failed to create club. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getClubTypeInfo = (type: string) => {
    switch (type) {
      case "open":
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Anyone can join",
          description: "Open to all members",
        };
      case "invite":
        return {
          icon: <Shield className="h-4 w-4" />,
          text: "Invite only",
          description: "Members must be invited or request to join",
        };
      case "closed":
        return {
          icon: <Lock className="h-4 w-4" />,
          text: "Closed",
          description: "Not accepting new members",
        };
      default:
        return {
          icon: <Globe className="h-4 w-4" />,
          text: "Unknown",
          description: "",
        };
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Image */}
        <Card>
          <CardHeader>
            <CardTitle>Club Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <ClubImageManager
              currentImage={formData.banner_image}
              onImageChange={handleImageChange}
              tempClubId={formData.tempClubId || generateTempClubId()}
              isTemp={true}
              uploadAction={
                uploadAction ||
                (() =>
                  Promise.resolve({ url: null, error: "Upload not available" }))
              }
              showPreviewOverlay={true}
              clubName={formData.name || "Your Club Name"}
              clubLocation={formData.location || "Location"}
            />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Club Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Auckland Drift Collective"
                  required
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/50 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    handleInputChange("location", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    {NZ_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your club's focus, activities, and what makes it special..."
                rows={4}
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Club Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Club Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Club Type</Label>
              <div className="grid gap-3">
                {(["open", "invite", "closed"] as const).map((type) => {
                  const typeInfo = getClubTypeInfo(type);
                  return (
                    <div
                      key={type}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.club_type === type
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => handleInputChange("club_type", type)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            formData.club_type === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {typeInfo.icon}
                        </div>
                        <div>
                          <div className="font-medium">{typeInfo.text}</div>
                          <div className="text-sm text-muted-foreground">
                            {typeInfo.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Club Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              {/* Preview club card - matching the main clubs page layout */}
              <div className="overflow-hidden rounded-lg border hover:shadow-lg transition-all duration-300">
                {/* Banner */}
                <div className="relative aspect-square overflow-hidden">
                  {formData.banner_image ? (
                    <Image
                      src={formData.banner_image}
                      alt="Club logo preview"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full  flex items-center justify-center">
                      <Users className="h-12 w-12 text-primary opacity-50" />
                    </div>
                  )}

                  {/* Member count */}
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    1/50
                  </div>

                  {/* Club type badge */}
                  <div
                    className={`absolute top-3 left-3 ${
                      formData.club_type === "open"
                        ? "bg-green-500"
                        : formData.club_type === "invite"
                        ? "bg-orange-500"
                        : "bg-red-500"
                    } text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
                  >
                    {getClubTypeInfo(formData.club_type).icon}
                    {getClubTypeInfo(formData.club_type).text}
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-2 mb-3">
                    <h3 className="font-bold text-lg leading-tight">
                      {formData.name || "Your Club Name"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formData.location || "Location"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        0
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {formData.description ||
                      "Club description will appear here..."}
                  </p>
                  <div className="text-xs text-muted-foreground mb-4">
                    Led by {user?.display_name || user?.username || user?.email}
                  </div>
                  <Button className="w-full" size="sm" disabled>
                    Preview Mode
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>Creating...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Club
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
