"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { driverService } from "@/lib/services/driver-service";
import { DriverStatus } from "@/lib/types/database";
import { VehicleChecklistDialog } from "./VehicleChecklistDialog";

export function AvailabilityToggle() {
    const [status, setStatus] = useState<DriverStatus>("offline");
    const [loading, setLoading] = useState(true);
    const [checklistOpen, setChecklistOpen] = useState(false);
    const [vehicleId, setVehicleId] = useState<string | null>(null);

    useEffect(() => {
        loadStatus();
        loadActiveAssignment();
    }, []);

    const loadStatus = async () => {
        try {
            const currentStatus = await driverService.getDriverStatus();
            if (currentStatus) {
                setStatus(currentStatus.status);
            }
        } catch (error) {
            console.error("Error loading status:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadActiveAssignment = async () => {
        try {
            const assignment = await driverService.getMyActiveAssignment();
            if (assignment) {
                setVehicleId(assignment.vehicle_id);
            }
        } catch (error) {
            console.error("Error loading assignment:", error);
        }
    };

    const handleToggle = async () => {
        if (status === "offline") {
            // Trying to go online
            if (!vehicleId) {
                toast.error("You must have an assigned vehicle to go online.");
                return;
            }
            setChecklistOpen(true);
        } else {
            // Going offline
            try {
                setLoading(true);
                await driverService.updateDriverStatus("offline");
                setStatus("offline");
                toast.success("You are now offline");
            } catch (error) {
                toast.error("Failed to go offline");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleChecklistSuccess = async () => {
        try {
            setLoading(true);
            await driverService.updateDriverStatus("online");
            setStatus("online");
            toast.success("You are now online");
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !status) return <div>Loading...</div>;

    const isOnline = status === "online" || status === "busy";

    return (
        <>
            <div className="flex flex-col items-center space-y-4 p-6 bg-card rounded-lg border shadow-sm">
                <h3 className="text-lg font-medium">Availability Status</h3>
                <div className="flex items-center space-x-4">
                    <Button
                        size="lg"
                        variant={isOnline ? "default" : "outline"}
                        className={`w-40 h-16 text-xl font-bold transition-all ${isOnline
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                        onClick={handleToggle}
                    >
                        {isOnline ? "ONLINE" : "OFFLINE"}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    {isOnline
                        ? "You are available for new jobs"
                        : "Go online to receive job requests"}
                </p>
            </div>

            <VehicleChecklistDialog
                open={checklistOpen}
                onOpenChange={setChecklistOpen}
                onSuccess={handleChecklistSuccess}
                vehicleId={vehicleId || undefined}
            />
        </>
    );
}
