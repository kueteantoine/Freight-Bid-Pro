"use client";

import { useEffect, useRef, useState } from "react";
import { updateDriverLocation, updateShipmentStatusFromGeofence } from "@/app/actions/tracking-actions";
import { isWithinRadius } from "@/lib/mapbox";
import { ShipmentStatus, TrackingEvent } from "@/lib/types/database";
import { toast } from "sonner";

interface LocationTrackerProps {
    shipmentId?: string;
    pickupCoords?: { lat: number; lng: number };
    deliveryCoords?: { lat: number; lng: number };
    currentStatus?: ShipmentStatus;
    onLocationUpdate?: (lat: number, lng: number) => void;
}

const GEOFENCE_RADIUS = 200; // meters
const UPDATE_INTERVAL = 30000; // 30 seconds for server sync

export function LocationTracker({
    shipmentId,
    pickupCoords,
    deliveryCoords,
    currentStatus,
    onLocationUpdate
}: LocationTrackerProps) {
    const watchId = useRef<number | null>(null);
    const lastSyncTime = useRef<number>(0);
    const [isArrivingAtPickup, setIsArrivingAtPickup] = useState(false);
    const [isArrivingAtDelivery, setIsArrivingAtDelivery] = useState(false);

    useEffect(() => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by this browser.");
            return;
        }

        const handlePositionData = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;

            // Notify parent component
            if (onLocationUpdate) {
                onLocationUpdate(latitude, longitude);
            }

            // 1. Check Geofencing logic if on a job
            if (shipmentId && currentStatus) {
                // If status is 'bid_awarded' (not yet arrived at pickup)
                if (currentStatus === 'bid_awarded' && pickupCoords) {
                    if (isWithinRadius(latitude, longitude, pickupCoords.lat, pickupCoords.lng, GEOFENCE_RADIUS)) {
                        if (!isArrivingAtPickup) {
                            setIsArrivingAtPickup(true);
                            await updateShipmentStatusFromGeofence(
                                shipmentId,
                                'in_transit', // OR 'arrived_at_pickup' if we had that intermediate status
                                'pickup_started',
                                latitude,
                                longitude
                            );
                            toast.success("Arrived at pickup location!");
                        }
                    }
                }

                // If status is 'in_transit' (checking for delivery)
                if (currentStatus === 'in_transit' && deliveryCoords) {
                    if (isWithinRadius(latitude, longitude, deliveryCoords.lat, deliveryCoords.lng, GEOFENCE_RADIUS)) {
                        if (!isArrivingAtDelivery) {
                            setIsArrivingAtDelivery(true);
                            // We don't necessarily mark as delivered automatically, 
                            // maybe just update tracking event 'Arrived at destination'
                            // The actual 'delivered' status might require a proof of delivery upload.
                            toast.info("Arrived at delivery location. Please complete the delivery checklist.");
                        }
                    }
                }
            }

            // 2. Sync with server periodically
            const now = Date.now();
            if (now - lastSyncTime.current > UPDATE_INTERVAL) {
                await updateDriverLocation(latitude, longitude, undefined, shipmentId);
                lastSyncTime.current = now;
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("Geolocation error:", error);
            // toast.error(`Positioning error: ${error.message}`);
        };

        watchId.current = navigator.geolocation.watchPosition(handlePositionData, handleError, {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000
        });

        return () => {
            if (watchId.current !== null) {
                navigator.geolocation.clearWatch(watchId.current);
            }
        };
    }, [shipmentId, pickupCoords, deliveryCoords, currentStatus, onLocationUpdate, isArrivingAtPickup, isArrivingAtDelivery]);

    return null; // Headless component
}
