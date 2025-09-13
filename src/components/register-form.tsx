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
import { Camera, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect } from "react";

export function RegisterForm({
  className,
  action,
  checkUsernameAvailability,
  checkEmailAvailability,
  ...props
}: React.ComponentProps<"div"> & {
  action: (formData: FormData) => Promise<void>;
  checkUsernameAvailability: (
    username: string
  ) => Promise<{ available: boolean; message: string }>;
  checkEmailAvailability: (
    email: string
  ) => Promise<{ available: boolean; message: string }>;
}) {
  const [profileImage, setProfileImage] = useState<string>("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    message: string;
    available: boolean | null;
    isChecking: boolean;
  }>({ message: "", available: null, isChecking: false });
  const [emailStatus, setEmailStatus] = useState<{
    message: string;
    available: boolean | null;
    isChecking: boolean;
  }>({ message: "", available: null, isChecking: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
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

  // Debounced username check
  const checkUsername = useCallback(
    async (username: string) => {
      if (!username || username.length < 3) {
        setUsernameStatus({ message: "", available: null, isChecking: false });
        return;
      }

      setUsernameStatus({ message: "", available: null, isChecking: true });

      try {
        const result = await checkUsernameAvailability(username);
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

  // Email checking function
  const checkEmail = useCallback(
    async (email: string) => {
      if (!email || email.length === 0) {
        setEmailStatus({ message: "", available: null, isChecking: false });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailStatus({
          message: "Please enter a valid email address",
          available: false,
          isChecking: false,
        });
        return;
      }

      setEmailStatus({ message: "", available: null, isChecking: true });

      try {
        const result = await checkEmailAvailability(email);
        setEmailStatus({
          message: result.message,
          available: result.available,
          isChecking: false,
        });
      } catch {
        setEmailStatus({
          message: "Error checking email",
          available: false,
          isChecking: false,
        });
      }
    },
    [checkEmailAvailability]
  );

  // Debounce username checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const usernameInput = document.getElementById(
        "username"
      ) as HTMLInputElement;
      if (usernameInput && usernameInput.value) {
        checkUsername(usernameInput.value);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [checkUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value;
    if (username.length >= 3) {
      setUsernameStatus({ message: "", available: null, isChecking: true });
      // Debounce the check
      setTimeout(() => checkUsername(username), 500);
    } else {
      setUsernameStatus({ message: "", available: null, isChecking: false });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    if (email.length > 0) {
      setEmailStatus({ message: "", available: null, isChecking: true });
      // Debounce the check
      setTimeout(() => checkEmail(email), 500);
    } else {
      setEmailStatus({ message: "", available: null, isChecking: false });
    }
  };

  const handleAction = async (formData: FormData) => {
    // Client-side validation BEFORE setting loading state
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;

    if (!password || !confirmPassword) {
      toast.error("Both password fields are required");
      // Reset only password fields using refs
      if (passwordRef.current) passwordRef.current.value = "";
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
      return;
    }

    // Check if username is available
    if (usernameStatus.available === false) {
      toast.error("Please choose a different username");
      return;
    }

    // Check if email is available
    if (emailStatus.available === false) {
      toast.error("Please use a different email address");
      return;
    }

    // If username hasn't been checked yet, check it now
    if (usernameStatus.available === null && username) {
      toast.error("Please wait while we check username availability");
      checkUsername(username);
      return;
    }

    // If email hasn't been checked yet, check it now
    if (emailStatus.available === null && email) {
      toast.error("Please wait while we check email availability");
      checkEmail(email);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      // Reset only password fields using refs
      if (passwordRef.current) passwordRef.current.value = "";
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      // Reset only password fields using refs
      if (passwordRef.current) passwordRef.current.value = "";
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = "";
      return;
    }

    try {
      setIsLoading(true);
      setUploadStatus("Creating account...");

      // Add the image file to FormData if one was selected
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      await action(formData);

      // If we reach here without redirect, something unexpected happened
      // In normal flow, successful registration should redirect and throw NEXT_REDIRECT
      console.warn(
        "Registration completed without redirect - unexpected behavior"
      );
    } catch (error) {
      // Check if this is a Next.js redirect (successful registration)
      // Only check for NEXT_REDIRECT message, not just any digest
      if (
        error &&
        typeof error === "object" &&
        (error.constructor.name === "RedirectError" ||
          (error as Error).message?.includes("NEXT_REDIRECT"))
      ) {
        // This is a successful redirect - don't show any toast
        // The redirect will happen automatically
        return;
      }

      // Reset upload status on error
      setUploadStatus("");

      // This is an actual registration error - no need to log since we're showing toast
      let errorMessage = "Registration failed. Please try again.";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleAction(formData);
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
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="username">Username *</Label>
                <div className="relative">
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="username"
                    required
                    onChange={handleUsernameChange}
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
                  <p
                    className={`text-sm ${
                      usernameStatus.available
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {usernameStatus.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    onChange={handleEmailChange}
                    className={
                      emailStatus.available === false
                        ? "border-red-500 focus:border-red-500"
                        : emailStatus.available === true
                        ? "border-green-500 focus:border-green-500"
                        : ""
                    }
                  />
                  {emailStatus.isChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                    </div>
                  )}
                </div>
                {emailStatus.message && (
                  <p
                    className={`text-sm ${
                      emailStatus.available ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {emailStatus.message}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Enter password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    ref={confirmPasswordRef}
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Confirm password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
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
