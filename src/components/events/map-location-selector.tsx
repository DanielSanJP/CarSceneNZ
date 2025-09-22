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
import { MapPin, Loader2 } from "lucide-react";
import MapComponent from "./map-component";

// Type for Nominatim API response
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface ImprovedLocationSelectorProps {
  selectedLocation: string;
  onLocationSelect: (location: string) => void;
  placeholder?: string;
  className?: string;
  initialLocation?: string; // For pre-populating map pin on edit forms
}

export function ImprovedLocationSelector({
  selectedLocation,
  onLocationSelect,
  placeholder = "Search for a location in New Zealand...",
  className = "",
  initialLocation,
}: ImprovedLocationSelectorProps) {
  // Main input state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mapSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map modal state
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<string>("");
  const [mapCoordinates, setMapCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [savedMapCoordinates, setSavedMapCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null); // Persistent coordinates for reopening modal
  const [mapSearchQuery, setMapSearchQuery] = useState<string>("");
  const [mapSearchResults, setMapSearchResults] = useState<NominatimResult[]>(
    []
  );
  const mapSearchDropdownRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=NZ&limit=8&addressdetails=1&accept-language=en&dedupe=1`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch location suggestions");
      }

      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error("Location search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle main input change with smart debouncing
  const handleMainInputChange = (value: string) => {
    onLocationSelect(value);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Smart debouncing: shorter delay for meaningful queries
    const delay = value.trim().length <= 2 ? 400 : 200; // Longer delay for short queries

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, delay);
  };

  // Select location from main search results
  const selectMainSearchResult = (result: NominatimResult) => {
    onLocationSelect(result.display_name);
    setSearchResults([]);
    setShowResults(false);
    mainInputRef.current?.blur();
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  // Map modal functions - using same logic as main search
  const searchMapLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMapSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=NZ&limit=8&addressdetails=1&accept-language=en&dedupe=1`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch location suggestions");
      }

      const data = await response.json();
      setMapSearchResults(data);
    } catch (error) {
      console.error("Map search error:", error);
      setMapSearchResults([]);
    }
  }, []);

  const handleMapSearchChange = (value: string) => {
    setMapSearchQuery(value);

    // Clear existing timeout
    if (mapSearchTimeoutRef.current) {
      clearTimeout(mapSearchTimeoutRef.current);
    }

    // Smart debouncing: shorter delay for meaningful queries
    const delay = value.trim().length <= 2 ? 400 : 200; // Longer delay for short queries

    // Set new timeout for search
    mapSearchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        searchMapLocations(value);
      } else {
        setMapSearchResults([]);
      }
    }, delay);
  };

  const selectMapSearchResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMapCoordinates({ lat, lng });
    setSelectedMapLocation(result.display_name);
    setMapSearchResults([]);
    // Don't close modal - let user see the pin and use "Save Location" button
  };

  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setMapCoordinates({ lat, lng });

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

  const saveMapLocation = () => {
    if (selectedMapLocation && mapCoordinates) {
      onLocationSelect(selectedMapLocation);
      setSavedMapCoordinates(mapCoordinates); // Save coordinates permanently
    }
    closeMapModal();
  };

  const closeMapModal = () => {
    setShowMapModal(false);
    // Only clear search-related state, preserve saved location
    setMapSearchQuery("");
    setMapSearchResults([]);

    // Reset to saved coordinates if they exist, otherwise clear
    if (savedMapCoordinates) {
      setMapCoordinates(savedMapCoordinates);
      // Optionally restore the saved location name
      // You might want to store selectedMapLocation permanently too
    } else {
      setSelectedMapLocation("");
      setMapCoordinates(null);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickInsideMainInput = mainInputRef.current?.contains(target);
      const isClickInsideMapDropdown =
        mapSearchDropdownRef.current?.contains(target);

      // Check if click is inside main dropdown container
      const mainDropdown = document.querySelector("[data-main-dropdown]");
      const isClickInsideMainDropdown = mainDropdown?.contains(target);

      // Check if click is inside map results container
      const mapResults = document.querySelector("[data-map-results]");
      const isClickInsideMapResults = mapResults?.contains(target);

      if (!isClickInsideMainInput && !isClickInsideMainDropdown) {
        setShowResults(false);
      }
      if (!isClickInsideMapDropdown && !isClickInsideMapResults) {
        setMapSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (mapSearchTimeoutRef.current) {
        clearTimeout(mapSearchTimeoutRef.current);
      }
    };
  }, []);

  // Geocode initial location to set map pin on mount
  useEffect(() => {
    const geocodeInitialLocation = async () => {
      if (initialLocation && initialLocation.trim()) {
        console.log("🗺️ Geocoding initial location:", initialLocation);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              initialLocation
            )}&countrycodes=NZ&limit=1&addressdetails=1&accept-language=en&dedupe=1`
          );

          if (response.ok) {
            const data = await response.json();
            console.log("🗺️ Geocoding response:", data);
            if (data && data.length > 0) {
              const result = data[0];
              const lat = parseFloat(result.lat);
              const lng = parseFloat(result.lon);
              const coordinates = { lat, lng };

              console.log("🗺️ Setting coordinates:", coordinates);
              setSavedMapCoordinates(coordinates);
              setMapCoordinates(coordinates);
              setSelectedMapLocation(result.display_name);
            } else {
              console.log(
                "🗺️ No geocoding results found for:",
                initialLocation
              );
            }
          } else {
            console.log("🗺️ Geocoding request failed:", response.status);
          }
        } catch (error) {
          console.error("Failed to geocode initial location:", error);
        }
      } else {
        console.log("🗺️ No initial location provided:", initialLocation);
      }
    };

    geocodeInitialLocation();
  }, [initialLocation]);

  // Ensure mapCoordinates are set when modal opens and we have saved coordinates
  useEffect(() => {
    if (showMapModal && savedMapCoordinates && !mapCoordinates) {
      console.log(
        "🗺️ Modal opened, setting mapCoordinates from saved:",
        savedMapCoordinates
      );
      setMapCoordinates(savedMapCoordinates);
    }
  }, [showMapModal, savedMapCoordinates, mapCoordinates]);

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="relative">
          <Input
            ref={mainInputRef}
            value={selectedLocation}
            onChange={(e) => handleMainInputChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pr-16"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Map button */}
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              console.log(
                "🗺️ Opening map modal. savedMapCoordinates:",
                savedMapCoordinates
              );
              setShowMapModal(true);
              // Always restore saved coordinates when opening modal
              if (savedMapCoordinates) {
                console.log(
                  "🗺️ Setting mapCoordinates from saved:",
                  savedMapCoordinates
                );
                setMapCoordinates(savedMapCoordinates);
              } else {
                console.log("🗺️ No saved coordinates found");
              }
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            title="Select location on map"
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>

        {/* Main input search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div
            data-main-dropdown
            className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-auto"
          >
            {searchResults.map((result, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectMainSearchResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors border-b border-border last:border-b-0 cursor-pointer"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {result.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Modal (existing functionality with improvements) */}
      <Dialog open={showMapModal} onOpenChange={closeMapModal}>
        <DialogContent className="!w-[80vw] !max-w-none !max-h-[95vh] !h-[95vh] !flex !flex-col !overflow-visible">
          <DialogHeader>
            <DialogTitle>Select Location on Map</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col flex-1 min-h-0 overflow-visible">
            {/* Map search input */}
            <div className="space-y-2 mb-4 flex-shrink-0">
              <Label htmlFor="map-search">Search Location</Label>
              <Input
                ref={mapSearchDropdownRef}
                id="map-search"
                value={mapSearchQuery}
                onChange={(e) => handleMapSearchChange(e.target.value)}
                placeholder="Search for a location..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            {/* Search results above map */}
            {mapSearchResults.length > 0 && (
              <div className="mb-4 flex-shrink-0">
                <div
                  data-map-results
                  className="bg-background border border-border rounded-md shadow-lg max-h-48 overflow-auto"
                >
                  {mapSearchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectMapSearchResult(result)}
                      className="w-full px-4 py-3 text-left hover:bg-muted focus:bg-muted focus:outline-none transition-colors border-b border-border last:border-b-0 cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {result.display_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

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
