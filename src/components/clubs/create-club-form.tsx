"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Upload,
  Camera,
  Users,
  Shield,
  Globe,
  Lock,
  MapPin,
  Star,
} from "lucide-react";
import Image from "next/image";

interface ClubFormData {
  name: string;
  description: string;
  location: string;
  club_type: "open" | "invite" | "closed";
  banner_image: string;
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
  onSuccess?: () => void;
  embedded?: boolean;
}

export function CreateClubForm({
  onSuccess,
  embedded = false,
}: CreateClubFormProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageError, setImageError] = useState(false);

  const [formData, setFormData] = useState<ClubFormData>({
    name: "",
    description: "",
    location: "",
    club_type: "open",
    banner_image: "",
  });

  if (!isAuthenticated || !user) {
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you would upload this to your server/cloud storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setImagePreview(imageUrl);
      setFormData((prev) => ({ ...prev, banner_image: imageUrl }));
      setImageError(false);
    };
    reader.readAsDataURL(file);

    // Clear the input
    e.target.value = "";
  };

  const handleImageError = () => {
    setImageError(true);
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
      // In a real app, this would be an API call
      const clubData = {
        ...formData,
        id: `club-${Date.now()}`,
        leader_id: user.id,
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
    } catch (error) {
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
    <div className={embedded ? "" : "max-w-4xl mx-auto"}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Image */}
        <Card>
          <CardHeader>
            <CardTitle>Club Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Banner Preview */}
            <div className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden max-w-md mx-auto">
              {imagePreview && !imageError ? (
                <div className="relative h-full">
                  <Image
                    src={imagePreview}
                    alt="Club logo preview"
                    fill
                    className="object-cover"
                    onError={handleImageError}
                  />
                  {/* Overlay to show how it will look */}

                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">
                      {formData.name || "Your Club Name"}
                    </h3>
                    <p className="text-sm opacity-90">
                      {formData.location || "Location"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Club logo preview
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Banner */}
            <div className="space-y-2">
              <Label htmlFor="banner-upload">Upload Club Logo</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <Label htmlFor="banner-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </Label>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended size: 400px × 400px (square). This will be the logo
                image for your club card.
              </p>
            </div>
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
                  {imagePreview && !imageError ? (
                    <Image
                      src={imagePreview}
                      alt="Club logo preview"
                      fill
                      className="object-cover"
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
                    Led by {user.display_name}
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
