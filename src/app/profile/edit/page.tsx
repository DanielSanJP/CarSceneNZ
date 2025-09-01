"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserById } from "@/lib/data";
import { uploadProfileImage } from "@/lib/utils/upload-profile-image";
import { createClient } from "@/lib/utils/supabase/client";
import { ArrowLeft, Upload, Save, Loader2, UserIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@/types/user";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user: authUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
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
    if (!loading && !isAuthenticated) {
      redirect("/login");
      return;
    }

    if (!authUser) return;

    const fetchProfileData = async () => {
      try {
        // Get full user profile from database
        const profileUser = await getUserById(authUser.id);
        if (profileUser) {
          // Merge auth data with profile data
          const fullUser = {
            ...profileUser,
            email: authUser.email || profileUser.email,
            display_name:
              authUser.user_metadata?.display_name ||
              authUser.user_metadata?.full_name ||
              profileUser.username,
          };
          setUser(fullUser);
          setDisplayName(fullUser.display_name);
          setUsername(fullUser.username);
          setPreviewUrl(fullUser.profile_image_url || null);
        } else {
          // Fallback to auth user data
          const fallbackUser = {
            id: authUser.id,
            username: authUser.email?.split("@")[0] || "user",
            display_name:
              authUser.user_metadata?.display_name ||
              authUser.user_metadata?.full_name ||
              authUser.email?.split("@")[0] ||
              "User",
            email: authUser.email || "",
            profile_image_url: authUser.user_metadata?.avatar_url,
            created_at: authUser.created_at || new Date().toISOString(),
            updated_at: authUser.updated_at || new Date().toISOString(),
          };
          setUser(fallbackUser);
          setDisplayName(fallbackUser.display_name);
          setUsername(fallbackUser.username);
          setPreviewUrl(fallbackUser.profile_image_url || null);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError("Failed to load profile data");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [authUser, isAuthenticated, loading]);

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
    if (!user || !authUser) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      // Update display name in auth metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
        },
      });

      if (metadataError) {
        console.error("Error updating auth metadata:", metadataError);
        setError("Failed to update display name");
        setSaving(false);
        return;
      }

      // Update username and display_name in users table
      const { error: profileError } = await supabase
        .from("users")
        .update({
          username: username,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        setError("Failed to update profile");
        setSaving(false);
        return;
      }

      // Upload new profile image if selected
      if (profileImageFile) {
        setUploadingImage(true);
        const imageUrl = await uploadProfileImage(profileImageFile, user.id);
        if (!imageUrl) {
          setError("Profile updated but image upload failed");
        }
        setUploadingImage(false);
      }

      setSuccess("Profile updated successfully!");

      // Refresh the page after a short delay
      setTimeout(() => {
        router.push(`/profile/${username || "user"}`);
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
    return null;
  }

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
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label htmlFor="profile-image" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Upload className="h-4 w-4" />
                        Choose Image
                      </div>
                    </Label>
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max size 5MB.
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
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                {uploadingImage && (
                  <p className="text-sm text-muted-foreground">
                    Uploading image...
                  </p>
                )}

                <Link href={`/profile/${username || "user"}`}>
                  <Button variant="outline" disabled={saving}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
