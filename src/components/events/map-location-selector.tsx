"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import MapComponent from "./map-component";

// Type for Nominatim API response
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface MapLocationSelectorProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  placeholder?: string;
  className?: string;
}

export function MapLocationSelector({
  selectedLocation,
  onLocationSelect,
  placeholder = "Search for a location in New Zealand...",
  className = "",
}: MapLocationSelectorProps) {
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<string>("");
  const [mapCoordinates, setMapCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState<string>("");
  const [mapSearchResults, setMapSearchResults] = useState<NominatimResult[]>(
    []
  );
  const mapSearchDropdownRef = useRef<HTMLInputElement>(null);

  // Search locations for map modal
  const searchMapLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setMapSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=NZ&limit=5&addressdetails=1&accept-language=en`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch location suggestions");
      }

      const data = await response.json();
      setMapSearchResults(data);
    } catch {
      setMapSearchResults([]);
    }
  }, []);

  // Handle map search input change
  const handleMapSearchChange = (value: string) => {
    setMapSearchQuery(value);
    if (value.length >= 3) {
      searchMapLocations(value);
    } else {
      setMapSearchResults([]);
    }
  };

  // Select location from map search results and center map
  const selectMapSearchResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCoordinates({ lat, lng });
    setSelectedMapLocation(result.display_name);
    setMapSearchQuery(result.display_name);
    setMapSearchResults([]);
  };

  // Handle map location selection
  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setMapCoordinates({ lat, lng });

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setSelectedMapLocation(data.display_name);
      }
    } catch {
      setSelectedMapLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  // Save selected map location
  const saveMapLocation = () => {
    if (selectedMapLocation) {
      onLocationSelect(selectedMapLocation);
    }
    setShowMapModal(false);
    setSelectedMapLocation("");
    setMapCoordinates(null);
  };

  // Close map modal
  const closeMapModal = () => {
    setShowMapModal(false);
    setSelectedMapLocation("");
    setMapCoordinates(null);
    setMapSearchQuery("");
    setMapSearchResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideMapDropdown =
        mapSearchDropdownRef.current?.contains(target);

      if (!isClickInsideMapDropdown) {
        setMapSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className={`relative ${className}`}>
        <Input
          value={selectedLocation}
          onChange={(e) => onLocationSelect(e.target.value)}
          placeholder={placeholder}
          className="pr-12"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowMapModal(true)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-primary"
          title="Select location on map"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Modal */}
      <Dialog open={showMapModal} onOpenChange={closeMapModal}>
        <DialogContent className="!w-[80vw] !max-w-none !max-h-[95vh] !h-[95vh] !flex !flex-col !overflow-visible">
          <DialogHeader>
            <DialogTitle>Select Location on Map</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col flex-1 min-h-0 overflow-visible">
            {/* Combined Location Search & Selection */}
            <div className="space-y-2 mb-4 flex-shrink-0 overflow-visible">
              <Label htmlFor="map-search">Search Location</Label>
              <div className="relative">
                <Input
                  ref={mapSearchDropdownRef}
                  id="map-search"
                  value={mapSearchQuery}
                  onChange={(e) => handleMapSearchChange(e.target.value)}
                  placeholder="Search for a location..."
                />

                {/* Map search results dropdown */}
                {mapSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {mapSearchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                        onClick={() => selectMapSearchResult(result)}
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <MapComponent
                selectedLocation={mapCoordinates}
                onLocationSelect={handleMapLocationSelect}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
              <Button variant="outline" onClick={closeMapModal}>
                Cancel
              </Button>
              <Button onClick={saveMapLocation} disabled={!selectedMapLocation}>
                Save Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
