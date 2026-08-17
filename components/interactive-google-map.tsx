"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink, AlertCircle, Navigation, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InteractiveGoogleMapProps {
  lat: number;
  lng: number;
  address?: string;
  height?: number;
  zoom?: number;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function InteractiveGoogleMap({ 
  lat, 
  lng, 
  address, 
  height = 400, 
  zoom = 16 
}: InteractiveGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setError("Google Maps API key not configured");
      return;
    }

    // Load Google Maps JavaScript API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => setError("Failed to load Google Maps");
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        // Create map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: zoom,
          mapTypeId: 'roadmap',
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'cooperative', // Allows scrolling page without zooming map
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        // Create custom marker
        const markerInstance = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance,
          title: address || 'Issue Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="12" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
                <path d="M16 8l-3 8h2v6h2v-6h2z" fill="#ffffff"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16)
          },
          animation: window.google.maps.Animation.DROP
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
                🚨 Issue Location
              </h3>
              ${address ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${address}</p>` : ''}
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
              </p>
            </div>
          `
        });

        // Show info window on marker click
        markerInstance.addListener('click', () => {
          infoWindow.open(mapInstance, markerInstance);
        });

        // Auto-open info window initially
        setTimeout(() => {
          infoWindow.open(mapInstance, markerInstance);
        }, 1000);

        setMap(mapInstance);
        setMarker(markerInstance);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError("Failed to initialize map");
      }
    };

    loadGoogleMaps();

    // Cleanup
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [lat, lng, address, zoom, apiKey]);

  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom() - 1);
    }
  };

  const handleRecenter = () => {
    if (map) {
      map.setCenter({ lat, lng });
      map.setZoom(zoom);
    }
  };

  // Show fallback if no API key or error
  if (!apiKey || error) {
    return (
      <div className="border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50" style={{ height }}>
        <div className="h-full flex flex-col items-center justify-center p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Issue Location</h3>
            <p className="text-sm text-red-600 mb-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {error || "Interactive map unavailable"}
            </p>
          </div>
          
          {address && (
            <div className="text-center mb-6 bg-white rounded-lg p-4 shadow-sm border max-w-sm">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-700">Issue Location</p>
              </div>
              <p className="text-sm text-gray-800 mb-2">{address}</p>
              <p className="text-xs text-gray-500">
                📍 {lat.toFixed(6)}, {lng.toFixed(6)}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button variant="default" size="sm" asChild className="flex-1">
              <a
                href={`https://maps.google.com/?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Google Maps
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild className="flex-1">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden relative" style={{ height }}>
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">Loading interactive map...</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Map controls */}
      {isLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomIn}
            className="w-10 h-10 p-0 shadow-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleZoomOut}
            className="w-10 h-10 p-0 shadow-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecenter}
            className="w-10 h-10 p-0 shadow-lg"
            title="Recenter"
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Map info */}
      {isLoaded && address && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg border max-w-xs z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs font-medium text-gray-700">Issue Location</p>
          </div>
          <p className="text-xs text-gray-600">{address}</p>
        </div>
      )}
    </div>
  );
}
