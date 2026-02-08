"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_ACCESS_TOKEN, getMapboxDirections } from "@/lib/mapbox";
import { useShipmentTracking } from "@/hooks/useShipmentTracking";
import { Loader2, Navigation, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface LiveTrackingMapProps {
    shipmentId: string;
    pickup: { lat: number; lng: number; address: string };
    delivery: { lat: number; lng: number; address: string };
}

export function LiveTrackingMap({ shipmentId, pickup, delivery }: LiveTrackingMapProps) {
    const { interpolatedLocation, shipment, isLoading } = useShipmentTracking(shipmentId);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const truckMarker = useRef<mapboxgl.Marker | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (!mapContainer.current || !navigator.onLine) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/navigation-day-v1",
            center: [pickup.lng, pickup.lat],
            zoom: 12,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        map.current.on("load", async () => {
            setMapLoaded(true);

            // Add Pickup and Delivery Markers
            new mapboxgl.Marker({ color: "#22c55e" })
                .setLngLat([pickup.lng, pickup.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<b>Pickup:</b> ${pickup.address}`))
                .addTo(map.current!);

            new mapboxgl.Marker({ color: "#ef4444" })
                .setLngLat([delivery.lng, delivery.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<b>Delivery:</b> ${delivery.address}`))
                .addTo(map.current!);

            // Draw Route
            const directions = await getMapboxDirections([pickup.lng, pickup.lat], [delivery.lng, delivery.lat]);
            if (directions?.routes?.[0]) {
                const route = directions.routes[0].geometry;
                map.current!.addSource("route", {
                    type: "geojson",
                    data: { type: "Feature", properties: {}, geometry: route }
                });
                map.current!.addLayer({
                    id: "route",
                    type: "line",
                    source: "route",
                    layout: { "line-join": "round", "line-cap": "round" },
                    paint: { "line-color": "#3b82f6", "line-width": 5, "line-opacity": 0.6 }
                });

                // Fit bounds
                const bounds = new mapboxgl.LngLatBounds();
                route.coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
                map.current!.fitBounds(bounds, { padding: 50 });
            }
        });

        return () => map.current?.remove();
    }, [shipmentId]);

    // Update Truck Marker with Interpolated Location
    useEffect(() => {
        if (!map.current || !mapLoaded || !interpolatedLocation) return;

        if (!truckMarker.current) {
            // Create truck element
            const el = document.createElement('div');
            el.className = 'truck-marker';
            el.innerHTML = `<div class="bg-primary text-white p-2 rounded-full shadow-2xl border-2 border-white transform transition-transform duration-100 ease-linear">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-4.5a2 2 0 0 0-1.6.8L14 13"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
            </div>`;

            truckMarker.current = new mapboxgl.Marker(el)
                .setLngLat([interpolatedLocation.lng, interpolatedLocation.lat])
                .addTo(map.current!);
        } else {
            truckMarker.current.setLngLat([interpolatedLocation.lng, interpolatedLocation.lat]);
        }
    }, [interpolatedLocation, mapLoaded]);

    if (isLoading && !shipment) {
        return (
            <div className="h-[400px] w-full flex items-center justify-center bg-muted rounded-2xl">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative h-[400px] w-full rounded-2xl overflow-hidden border shadow-sm group">
            <div ref={mapContainer} className="h-full w-full" />

            {/* Overlay Info */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 transition-opacity group-hover:opacity-100 opacity-90">
                <Badge className="bg-white/95 text-slate-900 shadow-xl border-none gap-2 py-2 px-3">
                    <Navigation className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Live Tracking</span>
                </Badge>

                {shipment?.estimated_arrival && (
                    <Badge variant="outline" className="bg-slate-900/90 text-white border-none gap-2 py-2 px-3">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px]">ETA: {format(new Date(shipment.estimated_arrival), "p")}</span>
                    </Badge>
                )}
            </div>

            {/* Offline Indicator */}
            {!navigator.onLine && (
                <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] flex items-center justify-center z-50">
                    <Badge variant="destructive" className="animate-bounce">Offline - Reconnecting...</Badge>
                </div>
            )}

            <style jsx global>{`
                .truck-marker {
                    z-index: 10;
                }
            `}</style>
        </div>
    );
}
