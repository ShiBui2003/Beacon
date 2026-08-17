"use client";

import LocationDebug from "@/components/location-debug";

export default function DebugLocationPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Location Access Debug</h1>
          <p className="text-muted-foreground">
            Test and debug location access functionality
          </p>
        </div>
        
        <LocationDebug />
      </div>
    </div>
  );
}
