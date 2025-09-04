"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Upload,
  Globe,
  Shield,
  Lock,
  Star,
  MapPin,
  Users,
} from "lucide-react";
import type { Club } from "@/types/club";
import { uploadClubImage } from "@/lib/utils/upload-club-images";

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

interface EditClubFormProps {
  club: Club;
  fromTab?: string;
}

export function EditClubForm({ club, fromTab = "join" }: EditClubFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(
    club.banner_image_url || ""
  );
  const [imageError, setImageError] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [formData, setFormData] = useState<ClubFormData>({
    name: club.name || "",
    description: club.description || "",
    location: club.location || "",
    club_type: (club.club_type as "open" | "invite" | "closed") || "open",
    banner_image: club.banner_image_url || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: ClubFormData) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setImageUploading(true);

    try {
      const uploadedUrl = await uploadClubImage(file, club.id);

      if (uploadedUrl) {
        setImagePreview(uploadedUrl);
        setFormData((prev: ClubFormData) => ({
          ...prev,
          banner_image: uploadedUrl,
        }));
        setImageError(false);
      } else {
        alert("Failed to upload image. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
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
      // In a real app, this would be an API call to update the club
      const updatedClubData = {
        ...formData,
        id: club.id,
        leader_id: club.leader_id,
        updated_at: new Date().toISOString(),
      };

      console.log("Updating club:", updatedClubData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirect back to the appropriate page
      router.push(
        fromTab === "myclub" ? "/clubs?tab=myclub" : `/clubs/${club.id}`
      );
    } catch (error) {
      console.error("Error updating club:", error);
      alert("Failed to update club. Please try again.");
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href={
                fromTab === "myclub" ? "/clubs?tab=myclub" : `/clubs/${club.id}`
              }
            >
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Club</h1>
              <p className="text-muted-foreground mt-1">
                Update your club&apos;s information and settings
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Banner Image */}
            <Card>
              <CardHeader>
                <CardTitle>Club Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden max-w-md mx-auto">
                  {imagePreview && !imageError ? (
                    <Image
                      src={imagePreview}
                      alt="Club preview"
                      fill
                      className="object-cover"
                      sizes="400px"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                      <Users className="h-16 w-16 text-primary opacity-50" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner-upload">Upload Club Logo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={imageUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {imageUploading ? "Uploading..." : "Choose File"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, at least 400x400px
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
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Enter club name"
                      required
                    />
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
                        <SelectValue placeholder="Select location" />
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
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe your club, what makes it special, and what members can expect..."
                    rows={4}
                    required
                  />
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
                  <Select
                    value={formData.club_type}
                    onValueChange={(value: "open" | "invite" | "closed") =>
                      handleInputChange("club_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>Open - Anyone can join</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="invite">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Invite Only - Members must be invited</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="closed">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          <span>Closed - Not accepting new members</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {getClubTypeInfo(formData.club_type).description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-md mx-auto">
                  <Card className="overflow-hidden">
                    <div className="relative aspect-square overflow-hidden">
                      {imagePreview && !imageError ? (
                        <Image
                          src={imagePreview}
                          alt={formData.name}
                          fill
                          className="object-cover"
                          sizes="400px"
                        />
                      ) : (
                        <div className="h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <Users className="h-12 w-12 text-primary opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                        <Users className="h-3 w-3" />1
                      </div>
                      <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        {getClubTypeInfo(formData.club_type).icon}
                        {getClubTypeInfo(formData.club_type).text.split(" ")[0]}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2 mb-3">
                        <h3 className="font-bold text-lg leading-tight">
                          {formData.name || "Club Name"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {formData.location || "Location"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {club.total_likes}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formData.description &&
                        formData.description.length > 60
                          ? `${formData.description.substring(0, 60)}...`
                          : formData.description || "Description..."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Link
                href={
                  fromTab === "myclub"
                    ? "/clubs?tab=myclub"
                    : `/clubs/${club.id}`
                }
              >
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Club"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
