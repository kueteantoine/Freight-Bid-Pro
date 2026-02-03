"use client";

import { useState } from "react";
import { ServiceOfferings } from "@/lib/types/database";
import { updateServiceOfferings } from "@/app/actions/carrier-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceConfigFormProps {
    initialData: ServiceOfferings | null;
}

const FREIGHT_TYPES = [
    "General Cargo",
    "Perishable Goods",
    "Hazardous Materials",
    "Fragile Items",
    "Construction Materials",
    "Vehicles",
    "Livestock",
    "Oversized Load"
];

const CAPABILITIES = [
    "Refrigerated Transport",
    "Lift Gate",
    "White Glove Service",
    "Express Delivery",
    "Weekend Delivery",
    "Real-time Tracking",
    "24/7 Support",
    "Warehousing"
];

export function ServiceConfigForm({ initialData }: ServiceConfigFormProps) {
    const [loading, setLoading] = useState(false);

    // Initialize form state
    const [freightTypes, setFreightTypes] = useState<string[]>(initialData?.freight_types || []);
    const [capabilities, setCapabilities] = useState<string[]>(initialData?.special_capabilities || []);
    const [maxDistance, setMaxDistance] = useState(initialData?.max_distance_km?.toString() || "");
    const [minWeight, setMinWeight] = useState(initialData?.min_weight_kg?.toString() || "");
    const [maxWeight, setMaxWeight] = useState(initialData?.max_weight_kg?.toString() || "");
    const [regions, setRegions] = useState<any[]>(initialData?.service_regions || []); // Placeholder for regions

    const handleFreightTypeToggle = (type: string) => {
        setFreightTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleCapabilityToggle = (cap: string) => {
        setCapabilities(prev =>
            prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateServiceOfferings({
                freight_types: freightTypes,
                special_capabilities: capabilities,
                max_distance_km: maxDistance ? parseInt(maxDistance) : null,
                min_weight_kg: minWeight ? parseFloat(minWeight) : null,
                max_weight_kg: maxWeight ? parseFloat(maxWeight) : null,
                service_regions: regions
            });
            toast.success("Service configuration updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update configuration");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Service Offerings</CardTitle>
                    <CardDescription>
                        Define what types of freight you carry and your operational capabilities.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-4">
                        <Label className="text-base">Supported Freight Types</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {FREIGHT_TYPES.map(type => (
                                <div key={type} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`freight-${type}`}
                                        checked={freightTypes.includes(type)}
                                        onCheckedChange={() => handleFreightTypeToggle(type)}
                                    />
                                    <Label htmlFor={`freight-${type}`} className="font-normal cursor-pointer">
                                        {type}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base">Special Capabilities</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {CAPABILITIES.map(cap => (
                                <div key={cap} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cap-${cap}`}
                                        checked={capabilities.includes(cap)}
                                        onCheckedChange={() => handleCapabilityToggle(cap)}
                                    />
                                    <Label htmlFor={`cap-${cap}`} className="font-normal cursor-pointer">
                                        {cap}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="maxDistance">Max Travel Distance (km)</Label>
                            <Input
                                id="maxDistance"
                                type="number"
                                placeholder="e.g. 500"
                                value={maxDistance}
                                onChange={(e) => setMaxDistance(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Leave empty for unlimited</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Weight Capacity Range (kg)</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder="Min"
                                    type="number"
                                    value={minWeight}
                                    onChange={(e) => setMinWeight(e.target.value)}
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                    placeholder="Max"
                                    type="number"
                                    value={maxWeight}
                                    onChange={(e) => setMaxWeight(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Region selection could be more complex (map or list of cities), keeping it simple for now or adding a placeholder */}
                    <div className="space-y-2">
                        <Label>Operating Regions</Label>
                        <div className="p-4 border rounded-md bg-slate-50 text-sm text-muted-foreground">
                            map-based region selection to be implemented. Currently defaults to "All Regions".
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
