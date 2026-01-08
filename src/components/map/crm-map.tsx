"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

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
    NEW: "#3b82f6",
    CONTACTED: "#8b5cf6",
    QUALIFIED: "#10b981",
    UNQUALIFIED: "#f59e0b",
    CONVERTED: "#059669",
    DEAD: "#ef4444",
    activity: "#6366f1",
    contact: "#06b6d4",
    account: "#f97316",
};

// Dynamically import the Leaflet map component (no SSR)
const LeafletMap = dynamic(() => import("./leaflet-map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-xl">
            <div className="text-white">Loading map...</div>
        </div>
    ),
});

export function CRMMap({
    markers = [],
    center = [29.4241, -98.4936], // San Antonio, TX
    zoom = 10,
    onMarkerClick,
    className = "w-full h-[600px]",
}: CRMMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className={`relative rounded-xl overflow-hidden bg-slate-900 ${className}`}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-white">Loading map...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative rounded-xl overflow-hidden ${className}`}>
            <LeafletMap
                markers={markers}
                center={center}
                zoom={zoom}
                onMarkerClick={onMarkerClick}
                statusColors={statusColors}
            />
        </div>
    );
}
