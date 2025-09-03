"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserIcon, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { uploadProfileImage } from "@/lib/utils/upload-profile-image";
import { updateUserProfile } from "@/lib/server/profile";
import type { User } from "@/types/user";

interface EditProfileClientProps {
  user: User;
}

export function EditProfileClient({ user }: EditProfileClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Set form data from user
    setDisplayName(user.display_name || "");
    setUsername(user.username);
    setPreviewUrl(user.profile_image_url || null);
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }

      setProfileImageFile(file);
      setError("");

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      console.log("Starting profile update process...");
      let finalImageUrl = user.profile_image_url;

      // Upload new profile image if selected
      if (profileImageFile) {
        setUploadingImage(true);
        console.log("Starting profile image upload...");

        const imageUrl = await uploadProfileImage(profileImageFile, user.id);
        console.log("Image upload completed, result:", imageUrl);

        if (imageUrl) {
          finalImageUrl = imageUrl;
          console.log("Final image URL set to:", finalImageUrl);
        } else {
          console.error("Image upload failed - no URL returned");
          setError("Failed to upload image. Please try again.");
          setUploadingImage(false);
          setSaving(false);
          return;
        }
        setUploadingImage(false);
      }

      // Update profile using server function
      console.log("Updating profile in database...");
      const updatedUser = await updateUserProfile(user.id, {
        username: username.trim(),
        display_name: displayName.trim(),
        profile_image_url: finalImageUrl || undefined,
      });

      if (!updatedUser) {
        setError("Failed to update profile. Please try again.");
        setSaving(false);
        return;
      }

      console.log("Profile updated successfully:", updatedUser);

      setSuccess("Profile updated successfully!");

      // Clean up file objects
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(finalImageUrl || null);
      setProfileImageFile(null);

      // Navigate after short delay
      setTimeout(() => {
        router.push(`/profile/${username}`);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Unexpected error during profile update:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href={`/profile/${username || "user"}`}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Edit Profile</h1>
              <p className="text-muted-foreground">
                Update your personal information
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Image */}
              <div className="space-y-4">
                <Label>Profile Image</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={previewUrl || undefined}
                      alt="Profile"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg">
                      {displayName
                        ? displayName.slice(0, 2).toUpperCase()
                        : username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="profile-image" className="cursor-pointer">
                      <Button variant="outline" type="button" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Image
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  This is your public display name. It can be your real name or
                  a pseudonym.
                </p>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                    )
                  }
                  placeholder="your_username"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  This is your unique username. Only lowercase letters, numbers,
                  and underscores allowed.
                </p>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    uploadingImage ||
                    !displayName.trim() ||
                    !username.trim()
                  }
                  className="min-w-[120px]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>

                {uploadingImage && (
                  <p className="text-sm text-muted-foreground">
                    Uploading image...
                  </p>
                )}

                <Link href={`/profile/${username || "user"}`}>
                  <Button variant="outline">Cancel</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
