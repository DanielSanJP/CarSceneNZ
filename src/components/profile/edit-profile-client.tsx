"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  UserIcon,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types/user";
import { useRouter } from "next/navigation";
import { compressImageForUpload } from "@/lib/utils/image-compression";

interface EditProfileClientProps {
  user: User;
  action: (
    formData: FormData
  ) => Promise<{ success: boolean; error?: string; user?: User } | void>;
  uploadAction: (
    formData: FormData
  ) => Promise<{ url: string | null; error: string | null }>;
  checkUsernameAvailability: (
    username: string
  ) => Promise<{ available: boolean; message: string }>;
}

export function EditProfileClient({
  user,
  action,
  uploadAction,
  checkUsernameAvailability,
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

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<{
    message: string;
    available: boolean | null;
    isChecking: boolean;
  }>({ message: "", available: null, isChecking: false });

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

      setProfileImageFile(file);
      setError("");

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleImageRemove = () => {
    setProfileImageFile(null);
    setPreviewUrl(null);
    setError("");
    // Clear the file input
    const fileInput = document.getElementById(
      "profile-image"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Username checking function
  const checkUsername = useCallback(
    async (newUsername: string) => {
      if (!newUsername || newUsername.length < 3) {
        setUsernameStatus({ message: "", available: null, isChecking: false });
        return;
      }

      setUsernameStatus({ message: "", available: null, isChecking: true });

      try {
        const result = await checkUsernameAvailability(newUsername);
        setUsernameStatus({
          message: result.message,
          available: result.available,
          isChecking: false,
        });
      } catch {
        setUsernameStatus({
          message: "Error checking username",
          available: false,
          isChecking: false,
        });
      }
    },
    [checkUsernameAvailability]
  );

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(newUsername);

    if (newUsername.length >= 3) {
      setUsernameStatus({ message: "", available: null, isChecking: true });
      // Debounce the check
      setTimeout(() => checkUsername(newUsername), 500);
    } else {
      setUsernameStatus({ message: "", available: null, isChecking: false });
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

      // Check username availability if it has changed
      if (
        username.trim() !== user.username &&
        usernameStatus.available === false
      ) {
        setError("Username is not available");
        setSaving(false);
        return;
      }

      // If username changed but we haven't checked it yet, check now
      if (
        username.trim() !== user.username &&
        usernameStatus.available === null
      ) {
        setError("Please wait for username availability check");
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
      let finalImageUrl: string | null = user.profile_image_url || null;

      // Handle profile image changes
      if (profileImageFile) {
        // Upload new profile image
        setUploadingImage(true);
        console.log("Starting profile image compression and upload...");

        try {
          // Compress the image first
          const compressionResult = await compressImageForUpload(
            profileImageFile,
            "profile"
          );

          console.log("Image compression completed:", {
            originalSize: compressionResult.originalSize,
            compressedSize: compressionResult.compressedSize,
            compressionRatio: compressionResult.compressionRatio,
          });

          const formData = new FormData();
          formData.append("file", compressionResult.file);
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
        } catch (compressionError) {
          console.error("Image compression failed:", compressionError);
          setError(
            compressionError instanceof Error
              ? compressionError.message
              : "Failed to process image. Please try again."
          );
          setUploadingImage(false);
          setSaving(false);
          return;
        }
        setUploadingImage(false);
      } else if (previewUrl === null && user.profile_image_url) {
        // User removed their profile image
        console.log("User removed profile image, setting to null");
        finalImageUrl = null;
      }

      // Create FormData for server action
      console.log("Creating FormData for server action...");
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("display_name", displayName.trim());
      if (finalImageUrl !== null) {
        formData.append("profile_image_url", finalImageUrl);
      } else {
        // Explicitly set empty string to remove the image
        formData.append("profile_image_url", "");
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
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-32 w-32 flex-shrink-0 rounded-full overflow-hidden bg-muted">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    sizes="256px"
                    quality={90}
                    priority={true}
                    unoptimized={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-medium">
                    {displayName
                      ? displayName.slice(0, 2).toUpperCase()
                      : username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  <Label htmlFor="profile-image" className="cursor-pointer">
                    <Button variant="outline" type="button" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </span>
                    </Button>
                  </Label>
                  {(previewUrl || user.profile_image_url) && (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleImageRemove}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG images supported. Click Remove to use default
                  placeholder.
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
            <div className="relative">
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="your_username"
                maxLength={30}
                className={
                  usernameStatus.available === false
                    ? "border-red-500 focus:border-red-500"
                    : usernameStatus.available === true
                    ? "border-green-500 focus:border-green-500"
                    : ""
                }
              />
              {usernameStatus.isChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                </div>
              )}
            </div>
            {usernameStatus.message && (
              <>
                {usernameStatus.available === false ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {usernameStatus.message}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert
                    variant="default"
                    className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/50 dark:text-green-200"
                  >
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription>
                      {usernameStatus.message}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
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
          <div className="flex items-center justify-end gap-4 pt-4">
            {uploadingImage && (
              <p className="text-sm text-muted-foreground mr-auto">
                Uploading image...
              </p>
            )}

            <Link href={`/profile/${username || "user"}`}>
              <Button variant="outline">Cancel</Button>
            </Link>

            <Button
              onClick={handleSave}
              disabled={
                saving ||
                uploadingImage ||
                !displayName.trim() ||
                !username.trim()
              }
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
