"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ShipmentTrackingWithUser, Shipment } from "@/lib/types/database";

interface UseShipmentTrackingReturn {
    trackingEvents: ShipmentTrackingWithUser[];
    shipment: Partial<Shipment> | null;
    interpolatedLocation: { lat: number; lng: number } | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Custom hook for real-time shipment tracking
 * Subscribes to location updates, status changes, and new tracking events
 */
export function useShipmentTracking(shipmentId: string): UseShipmentTrackingReturn {
    const [trackingEvents, setTrackingEvents] = useState<ShipmentTrackingWithUser[]>([]);
    const [shipment, setShipment] = useState<Partial<Shipment> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        // Initial fetch
        const fetchInitialData = async () => {
            try {
                // Fetch tracking events
                const { data: events, error: eventsError } = await supabase
                    .from("shipment_tracking")
                    .select(`
            *,
            profiles:recorded_by_user_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
                    .eq("shipment_id", shipmentId)
                    .order("event_timestamp", { ascending: false });

                if (eventsError) throw eventsError;
                setTrackingEvents(events || []);

                // Fetch shipment location data
                const { data: shipmentData, error: shipmentError } = await supabase
                    .from("shipments")
                    .select("current_latitude, current_longitude, estimated_arrival, status")
                    .eq("id", shipmentId)
                    .single();

                if (shipmentError) throw shipmentError;
                setShipment(shipmentData);

                setIsLoading(false);
            } catch (err) {
                setError(err as Error);
                setIsLoading(false);
            }
        };

        fetchInitialData();

        // Subscribe to tracking events
        const trackingChannel = supabase
            .channel(`shipment_tracking:${shipmentId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "shipment_tracking",
                    filter: `shipment_id=eq.${shipmentId}`,
                },
                async (payload) => {
                    // Fetch the full event with profile data
                    const { data: newEvent } = await supabase
                        .from("shipment_tracking")
                        .select(`
              *,
              profiles:recorded_by_user_id (
                id,
                first_name,
                last_name,
                avatar_url
              )
            `)
                        .eq("id", payload.new.id)
                        .single();

                    if (newEvent) {
                        setTrackingEvents((prev) => [newEvent, ...prev]);
                    }
                }
            )
            .subscribe();

        // Subscribe to shipment location updates
        const shipmentChannel = supabase
            .channel(`shipment:${shipmentId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "shipments",
                    filter: `id=eq.${shipmentId}`,
                },
                (payload) => {
                    setShipment((prev) => ({
                        ...prev,
                        current_latitude: payload.new.current_latitude,
                        current_longitude: payload.new.current_longitude,
                        estimated_arrival: payload.new.estimated_arrival,
                        status: payload.new.status,
                    }));
                }
            )
            .subscribe();

        // Cleanup subscriptions
        return () => {
            supabase.removeChannel(trackingChannel);
            supabase.removeChannel(shipmentChannel);
        };
    }, [shipmentId]);

    const [interpolatedLocation, setInterpolatedLocation] = useState<{ lat: number; lng: number } | null>(null);

    // 2. Marker Interpolation
    useEffect(() => {
        if (!shipment?.current_latitude || !shipment?.current_longitude) return;

        // If this is the first point, set it immediately
        if (!interpolatedLocation) {
            setInterpolatedLocation({
                lat: shipment.current_latitude,
                lng: shipment.current_longitude
            });
            return;
        }

        let animationFrameId: number;
        const targetLat = Number(shipment.current_latitude);
        const targetLng = Number(shipment.current_longitude);

        const interpolate = () => {
            setInterpolatedLocation((prev) => {
                if (!prev) return { lat: targetLat, lng: targetLng };

                const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;
                const factor = 0.05; // Smoothing factor (0.01 to 0.1)

                const newLat = lerp(prev.lat, targetLat, factor);
                const newLng = lerp(prev.lng, targetLng, factor);

                // Stop if we're very close
                if (Math.abs(newLat - targetLat) < 0.00001 && Math.abs(newLng - targetLng) < 0.00001) {
                    return { lat: targetLat, lng: targetLng };
                }

                animationFrameId = requestAnimationFrame(interpolate);
                return { lat: newLat, lng: newLng };
            });
        };

        animationFrameId = requestAnimationFrame(interpolate);
        return () => cancelAnimationFrame(animationFrameId);
    }, [shipment?.current_latitude, shipment?.current_longitude]);

    return { trackingEvents, shipment, interpolatedLocation, isLoading, error };
}
