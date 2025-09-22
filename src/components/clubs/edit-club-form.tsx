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
import { ClubImageManager } from "./club-image-manager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Globe,
  Shield,
  Lock,
  Star,
  MapPin,
  Users,
} from "lucide-react";
import type { Club } from "@/types/club";
// import { uploadClubImage } from "@/lib/utils/image-upload"; // TODO: Convert to server action

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
  uploadAction: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
  updateAction: (
    formData: FormData
  ) => Promise<{ success: boolean; error: string | null }>;
}

export function EditClubForm({
  club,
  fromTab = "join",
  uploadAction,
  updateAction,
}: EditClubFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(
    club.banner_image_url || ""
  );

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

  const handleImageChange = (imageUrl: string) => {
    setImagePreview(imageUrl);
    setFormData((prev: ClubFormData) => ({
      ...prev,
      banner_image: imageUrl,
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
      // Create FormData for server action
      const formDataForSubmit = new FormData();
      formDataForSubmit.append("clubId", club.id);
      formDataForSubmit.append("name", formData.name);
      formDataForSubmit.append("description", formData.description);
      formDataForSubmit.append("location", formData.location);
      formDataForSubmit.append("club_type", formData.club_type);
      formDataForSubmit.append("banner_image", formData.banner_image);

      console.log("Updating club with data:", formData);

      const result = await updateAction(formDataForSubmit);

      if (result.success) {
        // Redirect back to the appropriate page
        router.push(
          fromTab === "myclub" ? "/clubs?tab=myclub" : `/clubs/${club.id}`
        );
      } else {
        alert(result.error || "Failed to update club. Please try again.");
      }
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
    <>
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
          <CardContent>
            <ClubImageManager
              currentImage={imagePreview}
              onImageChange={handleImageChange}
              isLoading={isLoading}
              clubId={club.id}
              isTemp={false}
              uploadAction={uploadAction}
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
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
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
                    {club.total_likes || 1}/50
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
                        {club.total_likes || 0}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {formData.description ||
                      "Club description will appear here..."}
                  </p>
                  <div className="text-xs text-muted-foreground mb-4">
                    Led by{" "}
                    {club.leader?.display_name ||
                      club.leader?.username ||
                      "Club Leader"}
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
        <div className="flex justify-end gap-4">
          <Link
            href={
              fromTab === "myclub" ? "/clubs?tab=myclub" : `/clubs/${club.id}`
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
    </>
  );
}
