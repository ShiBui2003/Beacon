"use client";

import { useState, useEffect } from "react";
import { MapPin, ExternalLink, AlertCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoogleMapsEmbedProps {
  lat: number;
  lng: number;
  address?: string;
  height?: number;
  zoom?: number;
}

export default function GoogleMapsEmbed({ 
  lat, 
  lng, 
  address, 
  height = 200, 
  zoom = 16 
}: GoogleMapsEmbedProps) {
  const [mapError, setMapError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Only show fallback if there's actually no API key
  if (!apiKey) {
    return (
      <div className="border rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50" style={{ height }}>
        <div className="h-full flex flex-col items-center justify-center p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Issue Location</h3>
            {!apiKey && (
              <p className="text-sm text-orange-600 mb-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Google Maps API not configured
              </p>
            )}
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
              <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                <p className="text-xs text-red-700 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Exact issue location marked
                </p>
              </div>
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
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                OpenStreetMap
              </a>
            </Button>
          </div>

          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                window.open(url, '_blank');
              }}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              <Navigation className="w-3 h-3 mr-1" />
              Get Directions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden" style={{ height }}>
      <iframe
        src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=${zoom}&maptype=roadmap`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Issue Location with Marker"
        onError={() => setMapError(true)}
        onLoad={(e) => {
          // Check if iframe loaded successfully
          const iframe = e.target as HTMLIFrameElement;
          try {
            // If we can't access the iframe content, it might have failed
            setTimeout(() => {
              if (iframe.contentDocument === null) {
                setMapError(true);
              }
            }, 2000);
          } catch (error) {
            setMapError(true);
          }
        }}
      />
    </div>
  );
}
