"use client";

import { useEffect } from "react";

/**
 * Simple Google AdSense ad placements
 * Following the tutorial approach - clean and straightforward
 */

// Declare window.adsbygoogle type
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Homepage top banner - Google's responsive ad format
// Positioned above "Upcoming Events" section
// Google serves mobile-friendly ads on small screens automatically
export function HomePageBannerTop({ className = "" }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error: unknown) {
      console.error("AdSense Banner Top error:", error);
    }
  }, []);

  return (
    <div
      className={className}
      style={{
        maxWidth: "100%",
        width: "100%",
        margin: "0 auto",
        overflow: "hidden", // Prevent ad overflow on mobile
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3897665803515666"
        data-ad-slot="5135132637"
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Homepage bottom banner - Google's responsive ad format
// Positioned after "Upcoming Events" section (current location)
// Google serves mobile-friendly ads on small screens automatically
export function HomePageBannerBottom({
  className = "",
}: {
  className?: string;
}) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error: unknown) {
      console.error("AdSense Banner Bottom error:", error);
    }
  }, []);

  return (
    <div
      className={className}
      style={{
        maxWidth: "100%",
        width: "100%",
        margin: "0 auto",
        overflow: "hidden", // Prevent ad overflow on mobile
      }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3897665803515666"
        data-ad-slot="9760322650" // Existing slot
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Left sidebar ad - responsive vertical format
// Adapts automatically for mobile and desktop without reloading
export function LeftSidebarAd({ className = "" }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error: unknown) {
      console.error("AdSense Left Sidebar error:", error);
    }
  }, []);

  return (
    <div className={className} style={{ maxWidth: "200px" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3897665803515666"
        data-ad-slot="5591246446"
        data-ad-format="vertical"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Right sidebar ad - responsive vertical format
// Adapts automatically for mobile and desktop without reloading
export function RightSidebarAd({ className = "" }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error: unknown) {
      console.error("AdSense Right Sidebar error:", error);
    }
  }, []);

  return (
    <div className={className} style={{ maxWidth: "200px" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3897665803515666"
        data-ad-slot="8556321138"
        data-ad-format="vertical"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Event detail square ad - responsive square format
// Displays below event stats on event detail pages
// Adapts automatically for mobile and desktop without reloading
export function EventDetailSquareAd({
  className = "",
}: {
  className?: string;
}) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error: unknown) {
      console.error("AdSense Event Detail Square error:", error);
    }
  }, []);

  return (
    <div className={className} style={{ maxWidth: "100%", margin: "0 auto" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3897665803515666"
        data-ad-slot="7191284487"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
