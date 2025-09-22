"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, UserIcon, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types/user";
import { useRouter } from "next/navigation";

interface EditProfileClientProps {
  user: User;
  action: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string; user?: User } | void>;
  uploadAction: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
}

export function EditProfileClient({
  user,
  action,
  uploadAction,
}: EditProfileClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Set form data from user
    setDisplayName(user.display_name || "");
    setUsername(user.username);
    setInstagramUrl(user.instagram_url || "");
    setFacebookUrl(user.facebook_url || "");
    setTiktokUrl(user.tiktok_url || "");
    setPreviewUrl(user.profile_image_url || null);
  }, [user]);

  // Helper function to validate URLs
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Empty URLs are valid (optional field)
    try {
      new URL(url);
      return url.startsWith("http://") || url.startsWith("https://");
    } catch {
      return false;
    }
  };

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
      // Client-side validation
      if (!username.trim()) {
        setError("Username is required");
        setSaving(false);
        return;
      }

      if (!displayName.trim()) {
        setError("Display name is required");
        setSaving(false);
        return;
      }

      // Validate username format
      const usernameRegex = /^[a-z0-9_]+$/;
      if (!usernameRegex.test(username.trim())) {
        setError(
          "Username can only contain lowercase letters, numbers, and underscores"
        );
        setSaving(false);
        return;
      }

      if (username.trim().length < 3) {
        setError("Username must be at least 3 characters long");
        setSaving(false);
        return;
      }

      // Validate social media URLs
      if (instagramUrl && !isValidUrl(instagramUrl)) {
        setError(
          "Please enter a valid Instagram URL (starting with http:// or https://)"
        );
        setSaving(false);
        return;
      }

      if (facebookUrl && !isValidUrl(facebookUrl)) {
        setError(
          "Please enter a valid Facebook URL (starting with http:// or https://)"
        );
        setSaving(false);
        return;
      }

      if (tiktokUrl && !isValidUrl(tiktokUrl)) {
        setError(
          "Please enter a valid TikTok URL (starting with http:// or https://)"
        );
        setSaving(false);
        return;
      }

      console.log("Starting profile update process...");
      let finalImageUrl = user.profile_image_url;

      // Upload new profile image if selected
      if (profileImageFile) {
        setUploadingImage(true);
        console.log("Starting profile image upload...");

        const formData = new FormData();
        formData.append("file", profileImageFile);
        formData.append("userId", user.id);

        const uploadResult = await uploadAction(formData);
        console.log("Image upload completed, result:", uploadResult);

        if (uploadResult.url) {
          finalImageUrl = uploadResult.url;
          console.log("Final image URL set to:", finalImageUrl);
        } else {
          console.error("Image upload failed:", uploadResult.error);
          setError(
            uploadResult.error || "Failed to upload image. Please try again."
          );
          setUploadingImage(false);
          setSaving(false);
          return;
        }
        setUploadingImage(false);
      }

      // Create FormData for server action
      console.log("Creating FormData for server action...");
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("display_name", displayName.trim());
      if (finalImageUrl) {
        formData.append("profile_image_url", finalImageUrl);
      }
      // Always send social media URLs (including empty strings) to allow removal
      formData.append("instagram_url", instagramUrl.trim());
      formData.append("facebook_url", facebookUrl.trim());
      formData.append("tiktok_url", tiktokUrl.trim());

      // Call the server action
      const result = await action(formData);

      // Handle the response from server action
      if (result && !result.success) {
        setError(result.error || "Failed to update profile");
        setSaving(false);
        setUploadingImage(false);
        return;
      }

      // If we reach here, the action was successful
      if (result && result.success) {
        setSuccess("Profile updated successfully!");
        setSaving(false);
        setUploadingImage(false);

        // Navigate to the profile page after a short delay
        setTimeout(() => {
          if (result.user) {
            router.push(`/profile/${result.user.username}`);
          } else {
            router.push(`/profile/${username}`);
          }
        }, 1000);
        return;
      }

      // Fallback - shouldn't reach here but just in case
      setSuccess("Profile updated successfully!");
      setSaving(false);
      setUploadingImage(false);
    } catch (error) {
      console.error("Unexpected error during profile update:", error);
      setError("An unexpected error occurred. Please try again.");
      setSaving(false);
      setUploadingImage(false);
    }
  };

  return (
    <>
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
              <div className="relative h-20 w-20 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={25}
                    priority={true}
                    unoptimized={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-medium">
                    {displayName
                      ? displayName.slice(0, 2).toUpperCase()
                      : username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
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
              This is your public display name. It can be your real name or a
              pseudonym.
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
              This is your unique username. Only lowercase letters, numbers, and
              underscores allowed.
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted flex-1"
              />
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile/change-email">Change</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Click &quot;Change&quot; to update your email address. You&apos;ll
              need to verify the new email.
            </p>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Social Media Links</Label>
            <p className="text-sm text-muted-foreground">
              Add links to your social media profiles (optional)
            </p>

            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/yourusername"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/yourusername"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                type="url"
                value={tiktokUrl}
                onChange={(e) => setTiktokUrl(e.target.value)}
                placeholder="https://tiktok.com/@yourusername"
              />
            </div>
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
    </>
  );
}
