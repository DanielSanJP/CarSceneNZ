import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove console logs in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    // Use modern formats for better compression and quality
    formats: ['image/webp', 'image/avif'],
    // Configure allowed quality values
    qualities: [25, 50, 75, 90, 100],
    // Configure imageSizes for small fixed-size images like avatars
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Configure deviceSizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Allow images from Supabase storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tbuzolpjvyerzqdwitkj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Additional image optimization settings
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache for 30 days
  },

};

export default nextConfig;
