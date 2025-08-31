"use client";

import { useRef, useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MapComponentProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  selectedLocation,
  onLocationSelect,
  className = "",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isDraggingRef = useRef<boolean>(false);

  useEffect(() => {
    // Load Leaflet CSS and JS if not already loaded
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!(window as any).L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Initialize map centered on New Zealand
      const map = (window as any).L.map(mapRef.current, {
        center: selectedLocation
          ? [selectedLocation.lat, selectedLocation.lng]
          : [-41.2865, 174.7762],
        zoom: selectedLocation ? 15 : 6,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        doubleClickZoom: true,
      });

      // Add CartoDB Voyager tiles (most popular modern style)
      (window as any).L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // Handle map clicks - simple and direct
      map.on("click", (e: any) => {
        // Don't place marker if we're currently dragging
        if (isDraggingRef.current) {
          isDraggingRef.current = false; // Reset the flag
          return;
        }

        const { lat, lng } = e.latlng;

        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }

        // Add default Leaflet marker (much simpler!)
        const marker = (window as any).L.marker([lat, lng])
          .addTo(map)
          .openPopup();

        markerRef.current = marker;

        // Call the callback
        onLocationSelect(lat, lng);
      });

      // Track dragging to prevent click after drag
      map.on("dragstart", () => {
        isDraggingRef.current = true;
      });

      map.on("dragend", () => {
        isDraggingRef.current = false;
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedLocation) {
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add default Leaflet marker (much simpler!)
      const marker = (window as any).L.marker([
        selectedLocation.lat,
        selectedLocation.lng,
      ])
        .addTo(mapInstanceRef.current)
        .openPopup();

      markerRef.current = marker;

      // Center map on the location (without changing zoom level)
      mapInstanceRef.current.panTo([
        selectedLocation.lat,
        selectedLocation.lng,
      ]);
    } else {
      // Remove marker if no location selected
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  }, [selectedLocation]);

  return (
    <div
      ref={mapRef}
      className={`h-full w-full rounded-md border ${className}`}
    />
  );
};

export default MapComponent;
/* eslint-enable @typescript-eslint/no-explicit-any */
