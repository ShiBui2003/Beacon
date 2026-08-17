"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function TestLocationPage() {
  const [status, setStatus] = useState<string>("");
  const [location, setLocation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testLocation = () => {
    setStatus("");
    setLocation(null);
    setIsLoading(true);

    if (!navigator.geolocation) {
      setStatus("❌ Geolocation not supported");
      setIsLoading(false);
      return;
    }

    setStatus("🔄 Requesting location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setStatus("✅ Location access successful!");
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setStatus("❌ Location access blocked. Please allow location access in your browser settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            setStatus("❌ Location unavailable. Check your internet connection.");
            break;
          case error.TIMEOUT:
            setStatus("❌ Request timed out. Please try again.");
            break;
          default:
            setStatus("❌ Unknown error occurred.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Access Test
            </CardTitle>
            <CardDescription>
              Test if your browser can access your location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testLocation} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? "Testing..." : "Test Location Access"}
            </Button>

            {status && (
              <div className="p-4 rounded-lg border">
                <div className="flex items-start gap-2">
                  {status.includes("✅") ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : status.includes("❌") ? (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <p className="text-sm">{status}</p>
                </div>
              </div>
            )}

            {location && (
              <div className="p-4 rounded-lg border bg-green-50">
                <h4 className="font-medium text-green-800 mb-2">Location Data:</h4>
                <p className="text-sm text-green-700">
                  Latitude: {location.lat.toFixed(6)}<br/>
                  Longitude: {location.lng.toFixed(6)}<br/>
                  Accuracy: {location.accuracy.toFixed(0)} meters
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-2">
              <p><strong>If location access is blocked:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Click the lock icon (🔒) in your browser's address bar</li>
                <li>Change "Location" from "Block" to "Allow"</li>
                <li>Refresh this page and try again</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
