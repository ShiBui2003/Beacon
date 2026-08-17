"use client";

import React, { useEffect, useRef, useState } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

interface MapProps {
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

const MapComponent: React.FC<MapProps> = ({
    center,
    zoom,
    issues,
    onMarkerClick,
    selectedIssueId,
    userLocation,
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>();
    const [markers, setMarkers] = useState<any[]>([]);

    useEffect(() => {
        if (ref.current && !map) {
            const newMap = new window.google.maps.Map(ref.current, {
                center,
                zoom,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
            });
            setMap(newMap);
        }
    }, [ref, map]);

    // Update map center and zoom when props change
    useEffect(() => {
        if (map) {
            map.setCenter(center);
            map.setZoom(zoom);
        }
    }, [map, center, zoom]);

    // Clear existing markers and create new ones when issues change
    useEffect(() => {
        if (!map) return;

        // Clear existing markers
        markers.forEach((marker) => marker.setMap(null));
        setMarkers([]);

        const newMarkers: any[] = [];

        issues.forEach((issue) => {
            if (!issue.location_lat || !issue.location_lng) return;

            const position = {
                lat: Number(issue.location_lat),
                lng: Number(issue.location_lng),
            };

            // Get marker color based on status
            const getMarkerColor = (status: string) => {
                switch (status) {
                    case "submitted":
                        return "#3B82F6"; // blue
                    case "in-review":
                        return "#F59E0B"; // yellow
                    case "in-progress":
                        return "#F97316"; // orange
                    case "resolved":
                        return "#10B981"; // green
                    default:
                        return "#6B7280"; // gray
                }
            };

            // Create custom marker icon
            const markerIcon = {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: getMarkerColor(issue.status),
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
            };

            const marker = new window.google.maps.Marker({
                position,
                map,
                title: issue.title,
                icon: markerIcon,
            });

            // Add click listener
            marker.addListener("click", () => {
                onMarkerClick?.(issue.id);
            });

            // Highlight selected marker
            if (selectedIssueId === issue.id) {
                marker.setIcon({
                    ...markerIcon,
                    scale: 12,
                    strokeWeight: 3,
                    strokeColor: "#000000",
                });
            }

            newMarkers.push(marker);
        });

        // Add user location marker if available
        if (userLocation) {
            const userMarker = new window.google.maps.Marker({
                position: userLocation,
                map,
                title: "Your Location",
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeColor: "#FFFFFF",
                    strokeWeight: 3,
                },
            });
            newMarkers.push(userMarker);
        }

        setMarkers(newMarkers);
    }, [map, issues, onMarkerClick, selectedIssueId, userLocation]);

    return <div ref={ref} className="w-full h-full" />;
};

const render = (status: Status) => {
    if (status === Status.LOADING) return <div>Loading...</div>;
    if (status === Status.FAILURE) return <div>Error loading map</div>;
    return <div></div>;
};

interface GoogleMapProps extends MapProps {
    apiKey: string;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ apiKey, ...props }) => {
    return (
        <Wrapper apiKey={apiKey} render={render}>
            <MapComponent {...props} />
        </Wrapper>
    );
};
