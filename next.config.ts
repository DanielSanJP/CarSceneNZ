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
    qualities: [25, 50, 75, 100],
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
  // Configure server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit for handling image data
    },
  },
};

export default nextConfig;
