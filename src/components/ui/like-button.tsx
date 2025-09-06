"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface LikeButtonProps {
  carId: string;
  initialIsLiked?: boolean;
  variant?: "default" | "floating";
  size?: "sm" | "default" | "lg" | "xl";
  user?: {
    id: string;
  } | null;
  onLike?: (
    carId: string,
    userId: string
  ) => Promise<{ success: boolean; newLikeCount?: number; error?: string }>;
  onUnlike?: (
    carId: string,
    userId: string
  ) => Promise<{ success: boolean; newLikeCount?: number; error?: string }>;
  onLikeCountChange?: (newCount: number) => void;
}

export function LikeButton({
  carId,
  initialIsLiked = false,
  variant = "default",
  size = "default",
  user,
  onLike,
  onUnlike,
  onLikeCountChange,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  // Sync with initialIsLiked prop changes
  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple clicks while loading
    if (isLoading) {
      return;
    }

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);

    if (!user) {
      // Redirect to login or show login modal
      window.location.href = "/login";
      return;
    }

    if (!onLike || !onUnlike) {
      console.error("Like/Unlike actions not provided");
      return;
    }

    setIsLoading(true);

    try {
      const result = isLiked
        ? await onUnlike(carId, user.id)
        : await onLike(carId, user.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to update like");
      }

      // Update local state
      setIsLiked(!isLiked);

      // Update parent component with new like count
      if (onLikeCountChange && result.newLikeCount !== undefined) {
        onLikeCountChange(result.newLikeCount);
      }

      // Refresh router to sync state across pages
      router.refresh();
    } catch (error) {
      console.error("Error updating like:", error);
      // Could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };
  const buttonSize =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
      ? "h-12 w-12"
      : size === "xl"
      ? "h-10 w-10"
      : "h-10 w-10";
  const iconSize =
    size === "sm"
      ? "h-4 w-4"
      : size === "lg"
      ? "h-6 w-6"
      : size === "xl"
      ? "h-8 w-8"
      : "h-5 w-5";

  return (
    <button
      className={cn(
        buttonSize,
        "bg-transparent hover:bg-transparent border-none shadow-none",
        "transition-all duration-200 p-0 flex items-center justify-center",
        "cursor-pointer disabled:cursor-not-allowed"
      )}
      onClick={handleLike}
      disabled={isLoading}
      title={isLiked ? "Unlike this car" : "Like this car"}
    >
      <Star
        className={cn(
          iconSize,
          "transition-all duration-200 cursor-pointer",
          isLiked
            ? "text-yellow-500 fill-yellow-500"
            : "text-white/80 hover:text-yellow-500 hover:scale-110",
          variant === "floating" && "drop-shadow-lg",
          isAnimating && "animate-bounce",
          isLoading && "animate-pulse"
        )}
      />
    </button>
  );
}
