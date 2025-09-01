import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Use modern formats for better compression and quality
    formats: ['image/webp', 'image/avif'],
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
