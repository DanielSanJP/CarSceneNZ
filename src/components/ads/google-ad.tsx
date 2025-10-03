"use client";

import { useEffect, useRef } from "react";

interface GoogleAdProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal" | "fluid";
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
}

/**
 * Google AdSense Display Ad Component
 *
 * Usage:
 * 1. Create ad units in Google AdSense dashboard (Ads → By ad unit → Display ads)
 * 2. Copy the data-ad-slot ID from the generated code
 * 3. Use this component with your ad slot ID
 *
 * Example:
 * <GoogleAd adSlot="1234567890" adFormat="auto" />
 */
export default function GoogleAd({
  adSlot,
  adFormat = "auto",
  style = { display: "block" },
  className = "",
  fullWidthResponsive = true,
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // Only push ad if it hasn't been pushed yet
      if (adRef.current && typeof window !== "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adsbygoogle = ((window as any).adsbygoogle || []) as unknown[];

        // Check if ad is already loaded
        if (adRef.current.dataset.adsbygoogleStatus !== "done") {
          adsbygoogle.push({});
        }
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-client="ca-pub-3897665803515666"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  );
}
