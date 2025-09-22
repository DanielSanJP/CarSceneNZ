"use client";

import { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface MapComponentProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

// Inner component that handles the actual map logic
function LeafletMapInner({
  selectedLocation,
  onLocationSelect,
  className = "",
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize map only once
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        // Import Leaflet dynamically
        const L = (await import("leaflet")).default;

        // Import CSS by dynamically loading it
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        if (!mapRef.current || mapInstanceRef.current || !isMounted) return;

        console.log("🗺️ MapComponent: Initializing map with Leaflet");

        // Initialize map centered on New Zealand
        const map = L.map(mapRef.current, {
          center: [-41.2865, 174.7762], // Always start with NZ center
          zoom: 6, // Default zoom
          zoomControl: true,
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: true,
        });

        // Add CartoDB Voyager tiles
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 20,
          }
        ).addTo(map);

        // Handle map clicks
        map.on("click", (e: any) => {
          if (isDraggingRef.current) {
            isDraggingRef.current = false;
            return;
          }

          const { lat, lng } = e.latlng;

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Add marker
          const marker = L.marker([lat, lng]).addTo(map).openPopup();
          markerRef.current = marker;

          // Call the callback
          onLocationSelect(lat, lng);
        });

        // Track dragging
        map.on("dragstart", () => {
          isDraggingRef.current = true;
        });

        map.on("dragend", () => {
          isDraggingRef.current = false;
        });

        mapInstanceRef.current = map;
        setIsMapReady(true);
        console.log("🗺️ MapComponent: Map initialization complete");
      } catch (error) {
        console.error("🗺️ MapComponent: Failed to initialize map", error);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - onLocationSelect is stable from parent

  // Update marker when selectedLocation changes and map is ready
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) {
      console.log("🗺️ MapComponent: Map not ready yet, waiting...");
      return;
    }

    console.log("🗺️ MapComponent selectedLocation changed:", selectedLocation);

    const updateMarker = async () => {
      try {
        // Access Leaflet from global or import
        const L = (window as any).L || (await import("leaflet")).default;

        if (selectedLocation) {
          console.log("🗺️ MapComponent: Adding marker at", selectedLocation);

          // Remove existing marker
          if (markerRef.current) {
            console.log("🗺️ MapComponent: Removing existing marker");
            mapInstanceRef.current.removeLayer(markerRef.current);
          }

          // Add new marker
          const marker = L.marker([selectedLocation.lat, selectedLocation.lng])
            .addTo(mapInstanceRef.current)
            .openPopup();

          markerRef.current = marker;
          console.log("🗺️ MapComponent: Marker added successfully");

          // Center map on the location with appropriate zoom
          mapInstanceRef.current.setView(
            [selectedLocation.lat, selectedLocation.lng],
            15
          );
        } else {
          console.log("🗺️ MapComponent: No location, removing marker");
          // Remove marker if no location selected
          if (markerRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
          }
        }
      } catch (error) {
        console.error("🗺️ MapComponent: Failed to update marker", error);
      }
    };

    updateMarker();
  }, [selectedLocation, isMapReady]);

  return (
    <div
      ref={mapRef}
      className={`h-full w-full rounded-md border ${className}`}
    />
  );
}

// Dynamically import the map component to avoid SSR issues
const DynamicLeafletMap = dynamic(() => Promise.resolve(LeafletMapInner), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-md border bg-muted flex items-center justify-center">
      <div className="text-muted-foreground">Loading map...</div>
    </div>
  ),
});

const MapComponent: React.FC<MapComponentProps> = (props) => {
  return <DynamicLeafletMap {...props} />;
};

export default MapComponent;
/* eslint-enable @typescript-eslint/no-explicit-any */
