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
 * Simple ad implementation that relies on CSS media queries for responsive sizing.
 * The parent component should define specific sizes using CSS media queries.
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
    const loadAd = () => {
      try {
        if (!adRef.current || typeof window === "undefined") return;

        // Wait for AdSense script to be available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(window as any).adsbygoogle) {
          setTimeout(loadAd, 100);
          return;
        }

        // Check container has width (retry if not ready)
        const width = adRef.current.offsetWidth;
        if (width === 0) {
          setTimeout(loadAd, 100);
          return;
        }

        // Load the ad
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adsbygoogle = ((window as any).adsbygoogle || []) as unknown[];
        adsbygoogle.push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(loadAd, 150);

    return () => clearTimeout(timer);
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
