"use client";

import { useLocationService } from "@/hooks/useLocationService";
import { ShipmentStatus } from "@/lib/types/database";

interface LocationTrackerProps {
    shipmentId: string;
    pickupCoords?: { lat: number; lng: number };
    deliveryCoords?: { lat: number; lng: number };
    currentStatus: ShipmentStatus;
    isActive?: boolean;
}

/**
 * Headless component that handles location tracking for a driver on an active shipment.
 * It uses the useLocationService hook to manage background tracking, adaptive polling,
 * offline synchronization, and geofence detection.
 */
export default function LocationTracker({
    shipmentId,
    pickupCoords,
    deliveryCoords,
    currentStatus,
    isActive = true
}: LocationTrackerProps) {
    const { currentLocation, isOnline, batteryLevel } = useLocationService({
        shipmentId,
        pickupCoords,
        deliveryCoords,
        currentStatus,
        enabled: isActive
    });

    // This component is headless and purely functional.
    // However, it could optionally render a small status indicator.
    return (
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
            {isActive && (
                <div className="bg-background/80 backdrop-blur shadow-sm rounded-full px-3 py-1 flex items-center gap-2 border text-xs">
                    <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-muted-foreground">
                        {isOnline ? 'GPS Active' : 'Offline (Syncing)'}
                    </span>
                    {batteryLevel !== null && (
                        <span className="text-muted-foreground border-l pl-2">
                            {Math.round(batteryLevel * 100)}%
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
