"use client";

import Image from "next/image";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { useState, useRef } from "react";

export function RegisterForm({
  className,
  action,
  ...props
}: React.ComponentProps<"div"> & {
  action: (formData: FormData) => Promise<void>;
}) {
  const [profileImage, setProfileImage] = useState<string>("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleAction = async (formData: FormData) => {
    try {
      setError("");
      setIsLoading(true);
      setUploadStatus("Creating account...");

      // Add the image file to FormData if one was selected
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      await action(formData);

      setUploadStatus("Account created successfully! Redirecting...");

      // Redirect handled by Server Action
    } catch (error) {
      // Check if this is a Next.js redirect (expected behavior)
      if (
        error &&
        typeof error === "object" &&
        ("digest" in error || error.constructor.name === "RedirectError")
      ) {
        // This is a redirect, which is expected - don't show error
        return;
      }

      console.error("Registration error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
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
          <form action={handleAction}>
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
                        <Image
                          src={profileImage}
                          alt="Profile preview"
                          width={96}
                          height={96}
                          quality={100}
                          className="h-24 w-24 rounded-full object-cover"
                        />
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
