"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_ACCESS_TOKEN, getMapboxReverseGeocoding } from "@/lib/mapbox";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Check } from "lucide-react";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface MapPickerProps {
    initialCoords?: { lat: number; lng: number };
    onConfirm: (coords: { lat: number; lng: number }, address: string) => void;
}

export function MapPicker({ initialCoords, onConfirm }: MapPickerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(initialCoords || null);
    const [address, setAddress] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResolving, setIsResolving] = useState(false);

    useEffect(() => {
        if (!mapContainer.current) return;

        const center: [number, number] = initialCoords
            ? [initialCoords.lng, initialCoords.lat]
            : [12.3547, 7.3697]; // Center of Cameroon

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: center,
            zoom: initialCoords ? 14 : 5,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        if (initialCoords) {
            marker.current = new mapboxgl.Marker({ draggable: true })
                .setLngLat([initialCoords.lng, initialCoords.lat])
                .addTo(map.current);

            marker.current.on('dragend', handleMarkerDrag);
        }

        map.current.on('click', (e) => {
            const { lng, lat } = e.lngLat;
            handleLocationSelection(lat, lng);
        });

        return () => map.current?.remove();
    }, []);

    const handleMarkerDrag = () => {
        if (!marker.current) return;
        const { lng, lat } = marker.current.getLngLat();
        handleLocationSelection(lat, lng);
    };

    const handleLocationSelection = async (lat: number, lng: number) => {
        setSelectedCoords({ lat, lng });

        if (!marker.current) {
            marker.current = new mapboxgl.Marker({ draggable: true })
                .setLngLat([lng, lat])
                .addTo(map.current!);
            marker.current.on('dragend', handleMarkerDrag);
        } else {
            marker.current.setLngLat([lng, lat]);
        }

        setIsResolving(true);
        try {
            const addr = await getMapboxReverseGeocoding(lat, lng);
            if (addr) setAddress(addr);
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] w-full gap-4">
            <div className="relative flex-1 rounded-lg overflow-hidden border">
                <div ref={mapContainer} className="absolute inset-0" />
                {!MAPBOX_ACCESS_TOKEN && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center p-4 text-center">
                        <p className="text-destructive font-bold">Mapbox token missing</p>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase text-muted-foreground">Selected Address</p>
                        <p className="text-sm truncate">
                            {isResolving ? "Finding address..." : address || (selectedCoords ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}` : "Click on the map to select a location")}
                        </p>
                    </div>
                </div>

                <Button
                    className="w-full"
                    disabled={!selectedCoords || isResolving}
                    onClick={() => selectedCoords && onConfirm(selectedCoords, address)}
                >
                    {isResolving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                    Confirm Location
                </Button>
            </div>
        </div>
    );
}
