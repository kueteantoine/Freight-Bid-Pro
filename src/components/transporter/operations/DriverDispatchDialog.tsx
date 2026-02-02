"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { assignDriverAndVehicle, getTransporterResources } from "@/app/actions/transporter-actions";
import { Shipment, Vehicle } from "@/lib/types/database";
import { toast } from "sonner";
import { Loader2, Truck, User } from "lucide-react";

interface DriverDispatchDialogProps {
    shipment: Shipment;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DriverDispatchDialog({ shipment, open, onOpenChange, onSuccess }: DriverDispatchDialogProps) {
    const [drivers, setDrivers] = React.useState<{ id: string; name: string }[]>([]);
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [submitting, setSubmitting] = React.useState(false);

    const [selectedDriver, setSelectedDriver] = React.useState("");
    const [selectedVehicle, setSelectedVehicle] = React.useState("");

    React.useEffect(() => {
        if (open) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const { drivers, vehicles } = await getTransporterResources();
                    setDrivers(drivers);
                    setVehicles(vehicles);
                } catch (error: any) {
                    toast.error("Failed to load resources: " + error.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [open]);

    const handleAssign = async () => {
        if (!selectedDriver || !selectedVehicle) {
            toast.error("Please select both a driver and a vehicle.");
            return;
        }

        setSubmitting(true);
        try {
            await assignDriverAndVehicle(shipment.id, selectedDriver, selectedVehicle);
            toast.success("Driver and vehicle assigned successfully!");
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error("Failed to assign resources: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Dispatch Shipment</DialogTitle>
                    <DialogDescription className="font-medium">
                        Assign a driver and vehicle for load <span className="text-primary font-bold">{shipment.shipment_number}</span>.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading resources...</p>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 font-sans">Select Driver</Label>
                            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold font-sans">
                                    <SelectValue placeholder="Choose a driver" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {drivers.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400 font-bold">No drivers found</div>
                                    ) : (
                                        drivers.map((driver) => (
                                            <SelectItem key={driver.id} value={driver.id} className="font-bold">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 mr-2 text-slate-400" />
                                                    {driver.name}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 font-sans">Select Vehicle</Label>
                            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold font-sans">
                                    <SelectValue placeholder="Choose a vehicle" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    {vehicles.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400 font-bold">No vehicles found</div>
                                    ) : (
                                        vehicles.map((vehicle) => (
                                            <SelectItem key={vehicle.id} value={vehicle.id} className="font-bold">
                                                <div className="flex items-center gap-2">
                                                    <Truck className="h-4 w-4 mr-2 text-slate-400" />
                                                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black shadow-lg shadow-primary/20 transition-all font-sans"
                        onClick={handleAssign}
                        disabled={submitting || loading}
                    >
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        Confirm Dispatch
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
