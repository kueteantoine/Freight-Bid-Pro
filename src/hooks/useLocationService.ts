"use client";

import { useEffect, useRef, useState } from "react";
import Dexie, { Table } from "dexie";
import { updateDriverLocationEnhanced, updateShipmentStatusFromGeofence } from "@/app/actions/tracking-actions";
import { isWithinRadius } from "@/lib/mapbox";
import { ShipmentStatus, TrackingEvent } from "@/lib/types/database";
import { toast } from "sonner";

// Offline Database Schema
class TrackingDatabase extends Dexie {
    updates!: Table<{
        lat: number;
        lng: number;
        timestamp: string;
        velocity?: number;
        isSynced: number; // 0 for no, 1 for yes
    }>;

    constructor() {
        super("TrackingDatabase");
        this.version(1).stores({
            updates: "++id, timestamp, isSynced"
        });
    }
}

const db = new TrackingDatabase();

interface UseLocationServiceProps {
    shipmentId?: string;
    pickupCoords?: { lat: number; lng: number };
    deliveryCoords?: { lat: number; lng: number };
    currentStatus?: ShipmentStatus;
    enabled?: boolean;
}

export function useLocationService({
    shipmentId,
    pickupCoords,
    deliveryCoords,
    currentStatus,
    enabled = true
}: UseLocationServiceProps) {
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const watchId = useRef<number | null>(null);
    const wakeLock = useRef<any>(null);
    const lastSyncTime = useRef<number>(0);
    const lastGeofenceCheckTime = useRef<number>(0);

    // 1. Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // 2. Monitor battery level
    useEffect(() => {
        if ("getBattery" in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                setBatteryLevel(battery.level);
                battery.addEventListener("levelchange", () => setBatteryLevel(battery.level));
            });
        }
    }, []);

    // 3. Request Wake Lock
    const requestWakeLock = async () => {
        if ("wakeLock" in navigator) {
            try {
                wakeLock.current = await (navigator as any).wakeLock.request("screen");
            } catch (err) {
                console.warn("Wake Lock request failed:", err);
            }
        }
    };

    // 4. Adaptive Polling Interval
    const getUpdateInterval = (velocity?: number) => {
        if (batteryLevel && batteryLevel < 0.2) return 60000; // 60s if battery low
        if (!velocity) return 30000; // Default 30s

        const speedKmh = velocity * 3.6;
        if (speedKmh > 60) return 30000;
        if (speedKmh > 20) return 20000;
        if (speedKmh > 5) return 15000;
        return 60000; // Idle
    };

    // 5. Geofence Logic
    const checkGeofences = async (lat: number, lng: number) => {
        if (!shipmentId || !currentStatus) return;

        const now = Date.now();
        if (now - lastGeofenceCheckTime.current < 10000) return; // Check geofences every 10s max
        lastGeofenceCheckTime.current = now;

        const GEOFENCE_RADIUS = 200; // meters

        // Pickup detection
        if (currentStatus === 'bid_awarded' && pickupCoords) {
            if (isWithinRadius(lat, lng, pickupCoords.lat, pickupCoords.lng, GEOFENCE_RADIUS)) {
                await updateShipmentStatusFromGeofence(
                    shipmentId,
                    'in_transit',
                    'pickup_started',
                    lat,
                    lng,
                    'pickup'
                );
                toast.success("Arrived at pickup location!");
            }
        }

        // Delivery detection
        if (currentStatus === 'in_transit' && deliveryCoords) {
            if (isWithinRadius(lat, lng, deliveryCoords.lat, deliveryCoords.lng, GEOFENCE_RADIUS)) {
                toast.info("Arrived at delivery location. Please complete the delivery checklist.");
            }
        }
    };

    // 6. Sync Logic
    const syncWithServer = async () => {
        if (!isOnline) return;

        const now = Date.now();
        const unsynced = await db.updates.where("isSynced").equals(0).toArray();

        if (unsynced.length === 0) return;

        try {
            const result = await updateDriverLocationEnhanced(
                unsynced.map(u => ({ lat: u.lat, lng: u.lng, timestamp: u.timestamp, velocity: u.velocity })),
                shipmentId
            );

            if (result.success) {
                await db.updates.where("id").anyOf(unsynced.map(u => (u as any).id)).modify({ isSynced: 1 });
                lastSyncTime.current = now;
            }
        } catch (error) {
            console.error("Sync error:", error);
        }
    };

    // 7. Start Tracking
    useEffect(() => {
        if (!enabled || !navigator.geolocation) return;

        requestWakeLock();

        const handlePositionData = async (position: GeolocationPosition) => {
            const { latitude, longitude, speed } = position.coords;
            const velocity = speed === null ? undefined : speed;
            const timestamp = new Date(position.timestamp).toISOString();

            setCurrentLocation({ lat: latitude, lng: longitude });

            // Store in Dexie
            await db.updates.add({
                lat: latitude,
                lng: longitude,
                timestamp,
                velocity,
                isSynced: 0
            });

            // Check geofences
            checkGeofences(latitude, longitude);

            // Adaptive Sync
            const interval = getUpdateInterval(velocity);
            if (Date.now() - lastSyncTime.current > interval) {
                syncWithServer();
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error("Geolocation error:", error);
        };

        watchId.current = navigator.geolocation.watchPosition(handlePositionData, handleError, {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 10000
        });

        // Periodic sync for any missed points
        const syncInterval = setInterval(syncWithServer, 60000);

        return () => {
            if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
            if (wakeLock.current) wakeLock.current.release();
            clearInterval(syncInterval);
        };
    }, [enabled, shipmentId, currentStatus, pickupCoords, deliveryCoords, batteryLevel, isOnline]);

    return { currentLocation, isOnline, batteryLevel };
}
