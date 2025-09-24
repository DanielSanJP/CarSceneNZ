"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Global scroll restoration provider
 * Automatically scrolls to top on route changes with smooth behavior
 * Used by major apps like Twitter, Instagram, etc.
 */
export function ScrollRestorationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on route change with smooth behavior
    // Small delay to ensure the page has rendered
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Additional small delay for heavy pages
      setTimeout(scrollToTop, 50);
    });
  }, [pathname]);

  return <>{children}</>;
}

/**
 * Hook for manual smooth scroll to top
 * Can be used in components for explicit scroll actions
 */
export function useScrollToTop() {
  const scrollToTop = (behavior: ScrollBehavior = "smooth") => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior,
    });
  };

  return { scrollToTop };
}
