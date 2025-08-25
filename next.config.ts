import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use modern formats for better compression and quality
    formats: ['image/webp', 'image/avif'],
    // Allow local images from public directory
    remotePatterns: [],
    // Additional image optimization settings
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache for 30 days
  },
};

export default nextConfig;
