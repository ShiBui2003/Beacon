"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, X, Navigation } from "lucide-react";

interface LocationPickerProps {
  value: string;
  onChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

export default function LocationPicker({ 
  value, 
  onChange, 
  placeholder = "Enter your city/area",
  disabled = false 
}: LocationPickerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!apiKey) return;

    const loadGooglePlaces = () => {
      if (window.google && window.google.maps) {
        initializePlaces();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializePlaces;
      script.onerror = () => console.error('Failed to load Google Places API');
      document.head.appendChild(script);
    };

    const initializePlaces = () => {
      if (window.google && window.google.maps) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        setIsLoaded(true);
      }
    };

    loadGooglePlaces();
  }, [apiKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue.trim() || !isLoaded || !autocompleteService.current) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Get predictions for Indian locations
    autocompleteService.current.getPlacePredictions(
      {
        input: newValue,
        componentRestrictions: { country: 'IN' }, // Restrict to India
        types: ['(cities)'], // Focus on cities and localities
      },
      (predictions: PlacePrediction[] | null, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions.slice(0, 5)); // Limit to 5 suggestions
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  };

  const handlePredictionSelect = (prediction: PlacePrediction) => {
    setInputValue(prediction.description);
    setShowPredictions(false);
    setIsLoading(true);

    // Get place details including coordinates
    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['geometry', 'formatted_address', 'name']
        },
        (place: any, status: string) => {
          setIsLoading(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };
            onChange(prediction.description, coordinates);
          } else {
            onChange(prediction.description);
          }
        }
      );
    } else {
      setIsLoading(false);
      onChange(prediction.description);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocoding to get address
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any[], status: string) => {
              setIsLoading(false);
              if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;
                setInputValue(address);
                onChange(address, { lat: latitude, lng: longitude });
              } else {
                console.error('Geocoding failed:', status);
                onChange(`${latitude}, ${longitude}`, { lat: latitude, lng: longitude });
              }
            }
          );
        } else {
          setIsLoading(false);
          const coords = `${latitude}, ${longitude}`;
          setInputValue(coords);
          onChange(coords, { lat: latitude, lng: longitude });
        }
      },
      (error) => {
        setIsLoading(false);
        console.error('Geolocation error:', error);
        alert('Unable to retrieve your location. Please enter manually.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const clearLocation = () => {
    setInputValue('');
    onChange('');
    setPredictions([]);
    setShowPredictions(false);
  };

  // Fallback for when Google Places API is not available
  if (!apiKey) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            disabled={disabled}
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={clearLocation}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Google Places API not configured. Manual entry only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="pl-10 pr-20"
          />
          <div className="absolute right-1 top-1 flex gap-1">
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={clearLocation}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={getCurrentLocation}
              disabled={isLoading}
              title="Use current location"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Predictions Dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                onClick={() => handlePredictionSelect(prediction)}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-gray-900">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Start typing to search Indian cities, or click 📍 to use your current location
      </p>
    </div>
  );
}
