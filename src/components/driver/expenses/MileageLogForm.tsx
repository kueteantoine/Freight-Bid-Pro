"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Loader2, Save } from "lucide-react";
import { logMileage } from "@/app/actions/driver-expense-actions";
import { toast } from "sonner";

interface MileageLogFormProps {
    shipments: { id: string, shipment_number: string }[];
    onSuccess?: () => void;
}

export function MileageLogForm({ shipments, onSuccess }: MileageLogFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [startOdo, setStartOdo] = useState<string>("");
    const [endOdo, setEndOdo] = useState<string>("");

    const calculatedDistance = (parseFloat(endOdo) || 0) - (parseFloat(startOdo) || 0);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (calculatedDistance < 0) return toast.error("End odometer cannot be less than start odometer");

        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const result = await logMileage({
                start_odometer: parseFloat(startOdo),
                end_odometer: parseFloat(endOdo),
                trip_date: formData.get('trip_date') as string,
                shipment_id: (formData.get('shipment_id') as string) || undefined,
                purpose: formData.get('purpose') as string || undefined,
            });

            if (result.success) {
                toast.success("Mileage logged successfully");
                setStartOdo("");
                setEndOdo("");
                (e.target as HTMLFormElement).reset();
                onSuccess?.();
            } else {
                toast.error(result.error || "Failed to log mileage");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Log Trip Mileage
                </CardTitle>
                <CardDescription>Record your odometer readings for trip tracking.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_odometer">Start Odometer</Label>
                            <Input
                                id="start_odometer"
                                type="number"
                                value={startOdo}
                                onChange={(e) => setStartOdo(e.target.value)}
                                placeholder="00000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_odometer">End Odometer</Label>
                            <Input
                                id="end_odometer"
                                type="number"
                                value={endOdo}
                                onChange={(e) => setEndOdo(e.target.value)}
                                placeholder="00000"
                                required
                            />
                        </div>
                    </div>

                    {calculatedDistance > 0 && (
                        <div className="p-3 bg-primary/10 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Total Distance</p>
                            <p className="text-xl font-bold text-primary">{calculatedDistance.toLocaleString()} km</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="trip_date">Date</Label>
                            <Input
                                id="trip_date"
                                name="trip_date"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="shipment_id">Related Job (Optional)</Label>
                            <select
                                name="shipment_id"
                                className="w-full h-10 px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">None</option>
                                {shipments.map(s => (
                                    <option key={s.id} value={s.id}>{s.shipment_number}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose (Optional)</Label>
                        <Input
                            id="purpose"
                            name="purpose"
                            placeholder="e.g., Delivery to Douala"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading || calculatedDistance <= 0}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Log Mileage
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
