"use client";

import React from "react";
import { MapPin } from "lucide-react";

interface FallbackMapProps {
    center: { lat: number; lng: number };
    zoom: number;
    issues: Array<{
        id: string;
        title: string;
        status: string;
        priority: string;
        location_lat: number;
        location_lng: number;
        category: string;
    }>;
    onMarkerClick?: (issueId: string) => void;
    selectedIssueId?: string | null;
    userLocation?: { lat: number; lng: number } | null;
}

export const FallbackMap: React.FC<FallbackMapProps> = ({
    center,
    zoom,
    issues,
    onMarkerClick,
    selectedIssueId,
    userLocation,
}) => {
    const getMarkerColor = (status: string) => {
        switch (status) {
            case "submitted":
                return "bg-blue-500";
            case "in-review":
                return "bg-yellow-500";
            case "in-progress":
                return "bg-orange-500";
            case "resolved":
                return "bg-green-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                    {Array.from({ length: 48 }).map((_, i) => (
                        <div
                            key={i}
                            className="border border-gray-300 dark:border-gray-700"
                        />
                    ))}
                </div>
            </div>

            {/* Center Info */}
            <div className="text-center z-10">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                    Interactive Map Preview
                </h3>
                <p className="text-muted-foreground">
                    Add Google Maps API key for full functionality
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Showing {issues.length} issues as mock markers
                </p>
            </div>

            {/* Mock Issue Markers */}
            <div className="absolute inset-0">
                {issues.map((issue, index) => (
                    <div
                        key={issue.id}
                        className={`absolute w-4 h-4 rounded-full cursor-pointer transform -translate-x-2 -translate-y-2 border-2 border-white shadow-lg hover:scale-125 transition-transform ${getMarkerColor(
                            issue.status
                        )} ${
                            selectedIssueId === issue.id
                                ? "ring-2 ring-accent ring-offset-2 scale-125"
                                : ""
                        }`}
                        style={{
                            left: `${20 + (index % 6) * 12}%`,
                            top: `${25 + Math.floor(index / 6) * 15}%`,
                        }}
                        onClick={() => onMarkerClick?.(issue.id)}
                        title={issue.title}
                    />
                ))}

                {/* User Location Marker */}
                {userLocation && (
                    <div
                        className="absolute w-5 h-5 rounded-full bg-blue-500 border-3 border-white shadow-lg transform -translate-x-2.5 -translate-y-2.5 animate-pulse"
                        style={{
                            left: "50%",
                            top: "50%",
                        }}
                        title="Your Location"
                    />
                )}
            </div>

            {/* Coordinates Display */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 px-3 py-1 rounded text-xs text-muted-foreground border">
                Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)} | Zoom:{" "}
                {zoom}
            </div>
        </div>
    );
};
