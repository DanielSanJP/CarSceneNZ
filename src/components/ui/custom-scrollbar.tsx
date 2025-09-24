"use client";

import React, { useState, useEffect } from "react";

interface CustomScrollbarProps {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
  dependencies?: unknown[]; // Dependencies to trigger scroll metrics update
}

export function CustomScrollbar({
  scrollContainerRef,
  className = "",
  dependencies = [],
}: CustomScrollbarProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);

  // Update scroll metrics when content changes
  useEffect(() => {
    const updateScrollMetrics = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current;
        setScrollPosition(scrollTop);
        setScrollHeight(scrollHeight);
        setClientHeight(clientHeight);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      updateScrollMetrics();
      container.addEventListener("scroll", updateScrollMetrics);

      // Update on resize
      const resizeObserver = new ResizeObserver(updateScrollMetrics);
      resizeObserver.observe(container);

      return () => {
        container.removeEventListener("scroll", updateScrollMetrics);
        resizeObserver.disconnect();
      };
    }
  }, [scrollContainerRef, dependencies]);

  const hasScroll = scrollHeight > clientHeight;
  if (!hasScroll) return null;

  const thumbHeight = Math.max(
    (clientHeight / scrollHeight) * clientHeight,
    30
  );
  const thumbTop =
    (scrollPosition / (scrollHeight - clientHeight)) *
    (clientHeight - thumbHeight);

  const handleScrollbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const scrollRatio = clickY / rect.height;
    const newScrollTop = scrollRatio * (scrollHeight - clientHeight);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = newScrollTop;
    }
  };

  const handleThumbDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startScrollTop = scrollPosition;
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();

    const handlePointerMove = (moveE: PointerEvent) => {
      const deltaY = moveE.clientY - startY;
      const scrollRatio = deltaY / (rect.height - thumbHeight);
      const newScrollTop =
        startScrollTop + scrollRatio * (scrollHeight - clientHeight);

      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = Math.max(
          0,
          Math.min(newScrollTop, scrollHeight - clientHeight)
        );
      }
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div className={`flex flex-col items-center ml-4 ${className}`}>
      {/* Scroll track */}
      <div
        className="relative w-6 md:w-4 bg-muted/20 rounded-full cursor-pointer"
        style={{ height: clientHeight }}
        onClick={handleScrollbarClick}
      >
        {/* Scroll thumb */}
        <div
          className="absolute w-full bg-muted-foreground/70 rounded-full cursor-grab active:cursor-grabbing"
          style={{
            height: thumbHeight,
            top: thumbTop,
            minHeight: "30px",
          }}
          onPointerDown={handleThumbDrag}
        />
      </div>
    </div>
  );
}
