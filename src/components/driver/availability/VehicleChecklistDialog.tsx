"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { driverService } from "@/lib/services/driver-service";
import { toast } from "sonner";
import { VehicleChecklist, DriverAssignment } from "@/lib/types/database";

const checklistSchema = z.object({
    fuel_level: z.enum(["empty", "low", "half", "full"]),
    tire_pressure_ok: z.boolean().refine((val) => val === true, {
        message: "Tire pressure check is required",
    }),
    cleanliness_ok: z.boolean().refine((val) => val === true, {
        message: "Cleanliness check is required",
    }),
    safety_equipment_ok: z.boolean().refine((val) => val === true, {
        message: "Safety equipment check is required",
    }),
    gps_functional: z.boolean().refine((val) => val === true, {
        message: "GPS functional check is required",
    }),
    notes: z.string().optional(),
});

interface VehicleChecklistDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    vehicleId?: string;
}

export function VehicleChecklistDialog({
    open,
    onOpenChange,
    onSuccess,
    vehicleId,
}: VehicleChecklistDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof checklistSchema>>({
        resolver: zodResolver(checklistSchema),
        defaultValues: {
            fuel_level: "full",
            tire_pressure_ok: false,
            cleanliness_ok: false,
            safety_equipment_ok: false,
            gps_functional: false,
            notes: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof checklistSchema>) => {
        try {
            if (!vehicleId) {
                toast.error("No vehicle assigned. Cannot submit checklist.");
                return;
            }

            setIsSubmitting(true);
            await driverService.submitVehicleChecklist({
                ...values,
                vehicle_id: vehicleId,
            });

            toast.success("Checklist submitted successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error submitting checklist:", error);
            toast.error("Failed to submit checklist");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Vehicle Readiness Checklist</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="fuel_level"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fuel Level</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select fuel level" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="empty">Empty</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="half">Half</SelectItem>
                                            <SelectItem value="full">Full</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <FormLabel>Safety Checks</FormLabel>
                            <FormField
                                control={form.control}
                                name="tire_pressure_ok"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Tire Pressure</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cleanliness_ok"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Vehicle Cleanliness</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="safety_equipment_ok"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Safety Equipment</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="gps_functional"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>GPS Functional</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Any additional comments about vehicle condition..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit & Go Online"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
