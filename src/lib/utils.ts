import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for API calls, handling both development and production environments
 * Prioritizes NEXT_PUBLIC_SITE_URL, falls back to localhost for development
 */
export function getBaseUrl(): string {
  // Use NEXT_PUBLIC_SITE_URL if available (should be set in production)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Fallback to localhost for local development
  return "http://localhost:3000";
}
