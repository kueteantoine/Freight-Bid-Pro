"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, Loader2 } from "lucide-react";
import { driverService } from "@/lib/services/driver-service";
import { vehicleService } from "@/lib/services/vehicle-service";
import { Profile, Vehicle } from "@/lib/types/database";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AssignDriverDialogProps {
    onAssign?: () => void;
}

export function AssignDriverDialog({ onAssign }: AssignDriverDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [drivers, setDrivers] = useState<Profile[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [selectedDriver, setSelectedDriver] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState("");

    const fetchOptions = async () => {
        setFetching(true);
        try {
            const [driversData, vehiclesData] = await Promise.all([
                driverService.getMyDrivers(),
                vehicleService.getMyVehicles(),
            ]);
            setDrivers(driversData);
            setVehicles(vehiclesData);
        } catch (error) {
            console.error("Error fetching options:", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDriver || !selectedVehicle) {
            toast.error("Please select both a driver and a vehicle.");
            return;
        }

        setLoading(true);
        try {
            await driverService.assignDriver(selectedDriver, selectedVehicle);
            toast.success("Driver assigned to vehicle successfully!");
            setOpen(false);
            setSelectedDriver("");
            setSelectedVehicle("");
            onAssign?.();
        } catch (error) {
            console.error("Error assigning driver:", error);
            toast.error("Failed to assign driver. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Driver
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Assign Driver to Vehicle</DialogTitle>
                        <DialogDescription>
                            Select a driver and a vehicle to create a new assignment.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="driver">Select Driver</Label>
                            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                                <SelectTrigger id="driver">
                                    <SelectValue placeholder={fetching ? "Loading drivers..." : "Choose a driver"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {drivers.map((driver) => (
                                        <SelectItem key={driver.id} value={driver.id}>
                                            {driver.first_name} {driver.last_name}
                                        </SelectItem>
                                    ))}
                                    {drivers.length === 0 && !fetching && (
                                        <div className="p-2 text-sm text-muted-foreground text-center">No drivers found</div>
                                    ) || null}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="vehicle">Select Vehicle</Label>
                            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                                <SelectTrigger id="vehicle">
                                    <SelectValue placeholder={fetching ? "Loading vehicles..." : "Choose a vehicle"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map((vehicle) => (
                                        <SelectItem key={vehicle.id} value={vehicle.id}>
                                            {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                                        </SelectItem>
                                    ))}
                                    {vehicles.length === 0 && !fetching && (
                                        <div className="p-2 text-sm text-muted-foreground text-center">No vehicles found</div>
                                    ) || null}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading || fetching}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Assign Driver
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
