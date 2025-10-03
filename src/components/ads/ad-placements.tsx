"use client";

import GoogleAd from "./google-ad";

/**
 * Pre-configured ad placements for common use cases
 * Create corresponding ad units in your AdSense dashboard
 */

// Homepage horizontal banner (between sections)
export function HomePageBanner({ className }: { className?: string }) {
  return (
    <div className={`w-full my-4 ${className}`}>
      <GoogleAd
        adSlot="9760322650" // Homepage_Banner
        adFormat="horizontal"
        style={{ display: "block", minHeight: "90px" }}
      />
    </div>
  );
}

// Sidebar ad for desktop layouts
export function SidebarAd({ className }: { className?: string }) {
  return (
    <div className={`w-full my-4 ${className}`}>
      <GoogleAd
        adSlot="XXXXXXXXXX" // Replace with your Sidebar ad slot ID
        adFormat="vertical"
        style={{ display: "block", minHeight: "250px" }}
      />
    </div>
  );
}

// In-content ad (300x250 or responsive)
export function InContentAd({ className }: { className?: string }) {
  return (
    <div className={`w-full my-6 flex justify-center ${className}`}>
      <GoogleAd
        adSlot="XXXXXXXXXX" // Replace with your In-Content ad slot ID
        adFormat="rectangle"
        style={{ display: "inline-block", width: "300px", height: "250px" }}
        fullWidthResponsive={false}
      />
    </div>
  );
}

// Responsive ad that adapts to any container
export function ResponsiveAd({
  adSlot,
  className,
  minHeight = "250px",
}: {
  adSlot: string;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div className={`w-full my-4 ${className}`}>
      <GoogleAd
        adSlot={adSlot}
        adFormat="auto"
        style={{ display: "block", minHeight }}
      />
    </div>
  );
}

// Mobile-optimized footer ad
export function MobileFooterAd({ className }: { className?: string }) {
  return (
    <div className={`w-full mt-4 md:hidden ${className}`}>
      <GoogleAd
        adSlot="XXXXXXXXXX" // Replace with your Mobile Footer ad slot ID
        adFormat="auto"
        style={{ display: "block", minHeight: "50px" }}
      />
    </div>
  );
}
