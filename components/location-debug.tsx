"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, AlertCircle, CheckCircle } from "lucide-react";

export default function LocationDebug() {
  const [locationStatus, setLocationStatus] = useState<string>("");
  const [locationData, setLocationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testLocationAccess = () => {
    setLocationStatus("");
    setLocationData(null);
    setIsLoading(true);

    if (!navigator.geolocation) {
      setLocationStatus("❌ Geolocation is not supported by this browser");
      setIsLoading(false);
      return;
    }

    setLocationStatus("🔄 Requesting location access...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const data = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toLocaleString(),
        };
        setLocationData(data);
        setLocationStatus("✅ Location access successful!");
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = "❌ Location access failed: ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Permission denied. Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Position unavailable. Check your internet connection.";
            break;
          case error.TIMEOUT:
            errorMessage += "Request timed out. Please try again.";
            break;
          default:
            errorMessage += "Unknown error occurred.";
            break;
        }
        setLocationStatus(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  const checkBrowserSupport = () => {
    const support = {
      geolocation: !!navigator.geolocation,
      https: location.protocol === 'https:',
      localhost: location.hostname === 'localhost' || location.hostname === '127.0.0.1',
      userAgent: navigator.userAgent
    };
    
    setLocationData(support);
    setLocationStatus("🔍 Browser support information:");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Access Debug Tool
        </CardTitle>
        <CardDescription>
          Test and debug location access functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testLocationAccess} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Testing..." : "Test Location Access"}
          </Button>
          <Button 
            onClick={checkBrowserSupport} 
            variant="outline"
            className="flex-1"
          >
            Check Browser Support
          </Button>
        </div>

        {locationStatus && (
          <div className="p-3 rounded-lg border">
            <div className="flex items-start gap-2">
              {locationStatus.includes("✅") ? (
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              ) : locationStatus.includes("❌") ? (
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              ) : (
                <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
              )}
              <div className="text-sm">
                <p className="font-medium">{locationStatus}</p>
              </div>
            </div>
          </div>
        )}

        {locationData && (
          <div className="p-3 rounded-lg border bg-muted">
            <h4 className="font-medium mb-2">Data:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(locationData, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Make sure you're using HTTPS or localhost</li>
            <li>Allow location access when prompted by your browser</li>
            <li>Check if location services are enabled on your device</li>
            <li>Try refreshing the page if location access was previously denied</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
