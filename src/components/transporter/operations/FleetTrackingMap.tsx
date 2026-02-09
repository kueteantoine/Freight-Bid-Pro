"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Maximize2, Zap, Truck } from "lucide-react";
import { Shipment } from "@/lib/types/database";
import { MAPBOX_ACCESS_TOKEN } from "@/lib/mapbox";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface FleetTrackingMapProps {
    shipments: Shipment[];
}

export function FleetTrackingMap({ shipments }: FleetTrackingMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const activeShipments = shipments.filter(s => s.status === "in_transit" || s.status === "bid_awarded");

    useEffect(() => {
        if (!mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/light-v11",
            center: [12.3547, 7.3697], // Center of Cameroon
            zoom: 5.5,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        return () => {
            map.current?.remove();
        };
    }, []);

    useEffect(() => {
        if (!map.current) return;

        // Clean up old markers
        Object.keys(markers.current).forEach(id => {
            if (!activeShipments.find(s => s.id === id)) {
                markers.current[id].remove();
                delete markers.current[id];
            }
        });

        // Add/Update markers
        activeShipments.forEach((s, idx) => {
            // Use pickup coords as fallback if real tracking is missing for mock representation
            const lat = s.pickup_latitude || 4.0511 + (idx * 0.1);
            const lng = s.pickup_longitude || 9.7679 + (idx * 0.1);

            if (!markers.current[s.id]) {
                const el = document.createElement('div');
                el.className = 'fleet-marker';
                el.innerHTML = `<div class="p-2 rounded-xl flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-all hover:scale-110 ${s.status === "in_transit" ? "bg-primary text-white" : "bg-blue-500 text-white"}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-4.5a2 2 0 0 0-1.6.8L14 13"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                </div>`;

                const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
                    <div class="p-2 min-w-[150px]">
                        <div class="flex justify-between items-start mb-2">
                            <span class="text-[10px] font-bold text-muted-foreground">${s.shipment_number}</span>
                            <span class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">${s.status.replace(/_/g, " ")}</span>
                        </div>
                        <p class="text-sm font-bold mb-1">${s.delivery_location}</p>
                        <p class="text-[10px] text-muted-foreground">ETA: ${s.estimated_arrival ? new Date(s.estimated_arrival).toLocaleTimeString() : 'Pending'}</p>
                    </div>
                `);

                markers.current[s.id] = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .setPopup(popup)
                    .addTo(map.current!);
            } else {
                markers.current[s.id].setLngLat([lng, lat]);
            }
        });

        // Fit bounds if we have markers
        if (activeShipments.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            activeShipments.forEach((s, idx) => {
                const lat = s.pickup_latitude || 4.0511 + (idx * 0.1);
                const lng = s.pickup_longitude || 9.7679 + (idx * 0.1);
                bounds.extend([lng, lat]);
            });
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
        }
    }, [activeShipments]);

    return (
        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden h-full flex flex-col min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-white z-10">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-black">Fleet Tracking</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Coverage</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative flex-1 bg-slate-100">
                <div ref={mapContainer} className="absolute inset-0" />

                {/* Map Overlay Stats */}
                <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
                    <Badge className="bg-white/90 backdrop-blur shadow-xl border-none text-slate-900 px-4 py-3 rounded-2xl flex items-center gap-3 w-fit">
                        <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Active Assets</span>
                            <span className="font-black text-sm">{activeShipments.length}</span>
                        </div>
                    </Badge>
                </div>

                {!MAPBOX_ACCESS_TOKEN && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                        <div className="bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20 font-bold">
                            Mapbox token missing - Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
