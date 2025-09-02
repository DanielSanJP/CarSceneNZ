"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadProfileImage } from "@/lib/utils/upload-profile-image";
import { createClient } from "@/lib/utils/supabase/client";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [profileImage, setProfileImage] = useState<string>("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setUploadStatus("Creating account...");
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    const displayName = formData.get("displayName") as string;

    if (!email || !password || !username || !displayName) {
      setError("All fields are required");
      setIsLoading(false);
      setUploadStatus("");
      return;
    }

    try {
      const supabase = createClient();

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (authError) {
        console.error("Signup error:", authError);
        setError(authError.message || "Registration failed. Please try again.");
        return;
      }

      if (!authData.user) {
        setError("Registration failed. Please try again.");
        return;
      }

      // Create user profile in our database
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          username: username,
          display_name: displayName,
          profile_image_url: null,
        },
      ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        setError(
          "Account created but profile setup failed. Please contact support."
        );
        return;
      }

      // If there's a profile image, upload it
      if (profileImageFile && authData.user) {
        setUploadStatus("Uploading profile image...");

        const imageUrl = await uploadProfileImage(
          profileImageFile,
          authData.user.id
        );
        if (imageUrl) {
          // Update user profile with image URL
          await supabase
            .from("users")
            .update({ profile_image_url: imageUrl })
            .eq("id", authData.user.id);

          setUploadStatus("Profile image uploaded successfully!");
        } else {
          setUploadStatus(
            "Account created, but image upload failed. You can add it later in your profile."
          );
        }
      }

      // Success
      setUploadStatus("Account created successfully! Redirecting...");

      // Small delay to show success message
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Signup error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
      setIsLoading(false);
      setUploadStatus("");
    }
  };
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Join the Car Scene NZ community and connect with fellow enthusiasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {/* Profile Picture Section */}
              <div className="grid gap-3">
                <Label>Profile Picture</Label>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar
                      className="h-24 w-24 cursor-pointer"
                      onClick={handleImageClick}
                    >
                      {profileImage ? (
                        <AvatarImage src={profileImage} alt="Profile preview" />
                      ) : (
                        <AvatarFallback className="text-lg">
                          <Camera className="h-8 w-8" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={handleImageClick}
                    >
                      <Upload className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleImageClick}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Choose Photo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Profile picture upload"
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="username"
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Your display name"
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
                {uploadStatus && (
                  <p className="text-sm text-muted-foreground text-center">
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline underline-offset-4">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
