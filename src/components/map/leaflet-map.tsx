"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapMarker {
    id: string;
    latitude: number;
    longitude: number;
    type: "lead" | "contact" | "account" | "activity";
    status?: string;
    title: string;
    description?: string;
    color?: string; // Custom color for admin user tracking
}

interface LeafletMapProps {
    markers: MapMarker[];
    center: [number, number];
    zoom: number;
    onMarkerClick?: (marker: MapMarker) => void;
    statusColors: Record<string, string>;
}

export default function LeafletMap({
    markers,
    center,
    zoom,
    onMarkerClick,
    statusColors,
}: LeafletMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Initialize map
        mapRef.current = L.map(containerRef.current, {
            center: center,
            zoom: zoom,
            zoomControl: true,
        });

        // Add OpenStreetMap tiles (FREE!)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(mapRef.current);

        // Create markers layer group
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when they change
    useEffect(() => {
        if (!mapRef.current || !markersLayerRef.current) return;

        // Clear existing markers
        markersLayerRef.current.clearLayers();

        // Add new markers
        markers.forEach((markerData) => {
            const color = markerData.color
                || (markerData.status ? statusColors[markerData.status] : null)
                || statusColors[markerData.type]
                || "#64748b";

            // Create custom icon
            const icon = L.divIcon({
                className: "custom-marker",
                html: `<div style="
                    width: 24px;
                    height: 24px;
                    background-color: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                popupAnchor: [0, -12],
            });

            const marker = L.marker([markerData.latitude, markerData.longitude], { icon });

            // Create popup
            const popupContent = `
                <div style="padding: 8px; min-width: 150px;">
                    <h3 style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">${markerData.title}</h3>
                    ${markerData.description ? `<p style="margin: 0; font-size: 12px; color: #666;">${markerData.description}</p>` : ""}
                    ${markerData.status ? `<span style="display: inline-block; margin-top: 8px; padding: 2px 8px; background: ${color}20; color: ${color}; border-radius: 9999px; font-size: 11px; font-weight: 500;">${markerData.status}</span>` : ""}
                </div>
            `;
            marker.bindPopup(popupContent);

            if (onMarkerClick) {
                marker.on("click", () => onMarkerClick(markerData));
            }

            markersLayerRef.current?.addLayer(marker);
        });

        // Fit bounds to markers if there are any
        if (markers.length > 0) {
            const bounds = L.latLngBounds(
                markers.map((m) => [m.latitude, m.longitude] as [number, number])
            );
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [markers, statusColors, onMarkerClick]);

    return <div ref={containerRef} className="w-full h-full" />;
}
