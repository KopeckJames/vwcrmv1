"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    type: "lead" | "contact" | "account" | "activity";
    status?: string;
    title: string;
    description?: string;
}

interface CRMMapProps {
    markers?: MapMarker[];
    center?: [number, number];
    zoom?: number;
    onMarkerClick?: (marker: MapMarker) => void;
    className?: string;
}

const statusColors: Record<string, string> = {
    NEW: "#3b82f6",           // blue
    CONTACTED: "#8b5cf6",     // purple
    QUALIFIED: "#10b981",     // green
    UNQUALIFIED: "#f59e0b",   // amber
    CONVERTED: "#059669",     // emerald
    DEAD: "#ef4444",          // red
    activity: "#6366f1",      // indigo
    contact: "#06b6d4",       // cyan
    account: "#f97316",       // orange
};

export function CRMMap({
    markers = [],
    center = [-98.5795, 39.8283], // Center of USA
    zoom = 4,
    onMarkerClick,
    className = "w-full h-[600px]",
}: CRMMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainer.current) return;

        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
            console.error("Mapbox access token is not set");
            return;
        }

        mapboxgl.accessToken = accessToken;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: center,
            zoom: zoom,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true,
            }),
            "top-right"
        );

        map.current.on("load", () => {
            setMapLoaded(true);
        });

        return () => {
            map.current?.remove();
        };
    }, [center, zoom]);

    // Add markers when map is loaded
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Add new markers
        markers.forEach((markerData) => {
            const color = markerData.status
                ? statusColors[markerData.status] || "#64748b"
                : statusColors[markerData.type] || "#64748b";

            const el = document.createElement("div");
            el.className = "custom-marker";
            el.style.cssText = `
        width: 24px;
        height: 24px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      `;

            el.addEventListener("mouseenter", () => {
                el.style.transform = "scale(1.2)";
            });
            el.addEventListener("mouseleave", () => {
                el.style.transform = "scale(1)";
            });

            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <h3 style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">${markerData.title}</h3>
          ${markerData.description ? `<p style="margin: 0; font-size: 12px; color: #666;">${markerData.description}</p>` : ""}
          ${markerData.status ? `<span style="display: inline-block; margin-top: 8px; padding: 2px 8px; background: ${color}20; color: ${color}; border-radius: 9999px; font-size: 11px; font-weight: 500;">${markerData.status}</span>` : ""}
        </div>
      `);

            const marker = new mapboxgl.Marker(el)
                .setLngLat([markerData.longitude, markerData.latitude])
                .setPopup(popup)
                .addTo(map.current!);

            if (onMarkerClick) {
                el.addEventListener("click", () => onMarkerClick(markerData));
            }

            markersRef.current.push(marker);
        });

        // Fit bounds to markers if there are any
        if (markers.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            markers.forEach((m) => bounds.extend([m.longitude, m.latitude]));
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
        }
    }, [markers, mapLoaded, onMarkerClick]);

    return (
        <div className={`relative rounded-xl overflow-hidden ${className}`}>
            <div ref={mapContainer} className="w-full h-full" />
            {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <div className="text-white">Loading map...</div>
                </div>
            )}
        </div>
    );
}
