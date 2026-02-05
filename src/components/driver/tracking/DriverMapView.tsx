"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_ACCESS_TOKEN, getMapboxDirections } from "@/lib/mapbox";
import { Navigation, MapPin, Loader2 } from "lucide-react";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface DriverMapViewProps {
    pickup: { lat: number; lng: number };
    delivery: { lat: number; lng: number };
    currentLocation: { lat: number; lng: number } | null;
}

export default function DriverMapView({ pickup, delivery, currentLocation }: DriverMapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (!MAPBOX_ACCESS_TOKEN) {
            setError("Mapbox Access Token is missing. Please check your configuration.");
            setLoading(false);
            return;
        }

        const center: [number, number] = currentLocation
            ? [currentLocation.lng, currentLocation.lat]
            : [pickup.lng, pickup.lat];

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/navigation-night-v1",
            center: center,
            zoom: 14,
            pitch: 45, // Tilt for 3D navigation look
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.current.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showUserHeading: true,
            })
        );

        map.current.on("load", async () => {
            setLoading(false);

            // Add Pickup Marker
            new mapboxgl.Marker({ color: "#22c55e" }) // Green
                .setLngLat([pickup.lng, pickup.lat])
                .setPopup(new mapboxgl.Popup().setHTML("<h4>Pickup Location</h4>"))
                .addTo(map.current!);

            // Add Delivery Marker
            new mapboxgl.Marker({ color: "#ef4444" }) // Red
                .setLngLat([delivery.lng, delivery.lat])
                .setPopup(new mapboxgl.Popup().setHTML("<h4>Delivery Location</h4>"))
                .addTo(map.current!);

            // Fetch and draw route
            const directions = await getMapboxDirections([pickup.lng, pickup.lat], [delivery.lng, delivery.lat]);

            if (directions && directions.routes && directions.routes[0]) {
                const route = directions.routes[0].geometry;

                map.current!.addSource("route", {
                    type: "geojson",
                    data: {
                        type: "Feature",
                        properties: {},
                        geometry: route,
                    },
                });

                map.current!.addLayer({
                    id: "route",
                    type: "line",
                    source: "route",
                    layout: {
                        "line-join": "round",
                        "line-cap": "round",
                    },
                    paint: {
                        "line-color": "#3b82f6", // Blue
                        "line-width": 6,
                        "line-opacity": 0.75,
                    },
                });

                // Fit map to route
                const coordinates = route.coordinates;
                const bounds = coordinates.reduce((acc: mapboxgl.LngLatBounds, coord: [number, number]) => {
                    return acc.extend(coord);
                }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

                map.current!.fitBounds(bounds, { padding: 50 });
            }
        });

        return () => {
            map.current?.remove();
        };
    }, [pickup, delivery, currentLocation]);

    // Update center when currentLocation changes (if we want to auto-pan)
    useEffect(() => {
        if (map.current && currentLocation) {
            // Only pan if user hasn't interacted recently or if we want strict follow
            // map.current.easeTo({ center: [currentLocation.lng, currentLocation.lat], duration: 1000 });
        }
    }, [currentLocation]);

    return (
        <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border shadow-inner bg-muted">
            {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm font-medium">Loading Map...</p>
                </div>
            )}
            {error && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/10 p-4 text-center">
                    <p className="text-destructive font-medium">{error}</p>
                </div>
            )}
            <div ref={mapContainer} className="w-full h-full" />

            {/* Top Info Bar */}
            {!loading && (
                <div className="absolute top-4 left-4 right-16 flex gap-2">
                    <div className="bg-background/90 backdrop-blur border rounded-lg px-4 py-2 shadow-lg flex items-center gap-3 flex-1 overflow-hidden">
                        <div className="bg-primary/20 p-2 rounded-full">
                            <Navigation className="h-5 w-5 text-primary" />
                        </div>
                        <div className="truncate">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Next Step</p>
                            <p className="text-sm font-bold truncate">Continue on N3 for 15km</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
