"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Truck } from "lucide-react";
import { vehicleService } from "@/lib/services/vehicle-service";
import { toast } from "sonner";

const vehicleSchema = z.object({
    vehicle_type: z.string().min(1, "Vehicle type is required"),
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1),
    registration_number: z.string().min(1, "Registration number is required"),
    license_plate: z.string().min(1, "License plate is required"),
    capacity_kg: z.coerce.number().min(1, "Capacity is required"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function AddVehicleDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            vehicle_type: "",
            make: "",
            model: "",
            year: new Date().getFullYear(),
            registration_number: "",
            license_plate: "",
            capacity_kg: 0,
        },
    });

    async function onSubmit(data: VehicleFormValues) {
        setIsSubmitting(true);
        try {
            await vehicleService.addVehicle({
                ...data,
                capacity_cubic_meters: null,
                insurance_policy_number: null,
                insurance_expiry_date: null,
                gps_device_id: null,
                last_maintenance_date: null,
                next_maintenance_due_date: null,
                status: "active"
            });
            toast.success("Vehicle added successfully");
            onSuccess();
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error("Error adding vehicle:", error);
            toast.error("Failed to add vehicle");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-3xl">
                <DialogHeader>
                    <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4">
                        <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold">Add New Vehicle</DialogTitle>
                    <DialogDescription>
                        Register a new truck to your fleet. All fields are required.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="vehicle_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl h-12">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Semi-Trailer">Semi-Trailer</SelectItem>
                                                <SelectItem value="Flatbed">Flatbed</SelectItem>
                                                <SelectItem value="Refrigerated">Refrigerated (Cold Chain)</SelectItem>
                                                <SelectItem value="Tanker">Tanker</SelectItem>
                                                <SelectItem value="Box Truck">Box Truck</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Manufacturing Year</FormLabel>
                                        <FormControl>
                                            <Input type="number" className="rounded-xl h-12" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="make"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Make</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Mercedes-Benz" className="rounded-xl h-12" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Actros" className="rounded-xl h-12" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="registration_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registration Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Unique VIN/Reg ID" className="rounded-xl h-12" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="license_plate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>License Plate</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. CE-123-LT" className="rounded-xl h-12" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="capacity_kg"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Maximum Payload Capacity (kg)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g. 25000" className="rounded-xl h-12" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12 px-8 font-bold">
                                Cancel
                            </Button>
                            <Button disabled={isSubmitting} type="submit" className="rounded-xl h-12 px-12 font-bold shadow-lg shadow-primary/20">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    "Save Vehicle"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
