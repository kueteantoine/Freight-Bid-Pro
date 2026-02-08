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

import { getPreferredRoutes, addPreferredRoute, deletePreferredRoute } from "@/app/actions/carrier-settings-actions";
import { MapPin, Plus, Trash2 } from "lucide-react";

export function ServiceConfigForm({ initialData }: ServiceConfigFormProps) {
    const [loading, setLoading] = useState(false);

    // Initialize form state
    const [freightTypes, setFreightTypes] = useState<string[]>(initialData?.freight_types || []);
    const [capabilities, setCapabilities] = useState<string[]>(initialData?.special_capabilities || []);
    const [maxDistance, setMaxDistance] = useState(initialData?.max_distance_km?.toString() || "");
    const [minWeight, setMinWeight] = useState(initialData?.min_weight_kg?.toString() || "");
    const [maxWeight, setMaxWeight] = useState(initialData?.max_weight_kg?.toString() || "");

    // New fields
    const [baseCity, setBaseCity] = useState(initialData?.base_city || "");
    const [radius, setRadius] = useState(initialData?.service_radius_km?.toString() || "100");
    const [willingToBackhaul, setWillingToBackhaul] = useState(initialData?.willing_to_backhaul ?? true);
    const [crossBorder, setCrossBorder] = useState(initialData?.cross_border ?? false);

    const [preferredRoutes, setPreferredRoutes] = useState<any[]>([]);
    const [newRouteFrom, setNewRouteFrom] = useState("");
    const [newRouteTo, setNewRouteTo] = useState("");

    const loadRoutes = async () => {
        const routes = await getPreferredRoutes();
        setPreferredRoutes(routes);
    };

    useState(() => {
        loadRoutes();
    });

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

    const handleAddRoute = async () => {
        if (!newRouteFrom || !newRouteTo) return;
        setLoading(true);
        try {
            await addPreferredRoute({ from_city: newRouteFrom, to_city: newRouteTo });
            await loadRoutes();
            setNewRouteFrom("");
            setNewRouteTo("");
            toast.success("Route added");
        } catch (error) {
            toast.error("Failed to add route");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoute = async (id: string) => {
        setLoading(true);
        try {
            await deletePreferredRoute(id);
            await loadRoutes();
            toast.success("Route removed");
        } catch (error) {
            toast.error("Failed to remove route");
        } finally {
            setLoading(false);
        }
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
                base_city: baseCity,
                service_radius_km: parseInt(radius),
                willing_to_backhaul: willingToBackhaul,
                cross_border: crossBorder
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Service Area & Hub</CardTitle>
                    <CardDescription>
                        Define where you operate and your service radius from base.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="baseCity">Base City (Operations Hub)</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="baseCity"
                                    placeholder="e.g. Douala"
                                    className="pl-10"
                                    value={baseCity}
                                    onChange={(e) => setBaseCity(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="radius">Service Radius (km from hub)</Label>
                            <Select value={radius} onValueChange={setRadius}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select radius" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="100">100 km (Local)</SelectItem>
                                    <SelectItem value="250">250 km (Regional)</SelectItem>
                                    <SelectItem value="500">500 km (National)</SelectItem>
                                    <SelectItem value="1000">1000+ km (Long Haul)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="backhaul"
                                checked={willingToBackhaul}
                                onCheckedChange={(checked) => setWillingToBackhaul(checked as boolean)}
                            />
                            <Label htmlFor="backhaul" className="cursor-pointer">Willing to accept backhaul (return) loads</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="crossborder"
                                checked={crossBorder}
                                onCheckedChange={(checked) => setCrossBorder(checked as boolean)}
                            />
                            <Label htmlFor="crossborder" className="cursor-pointer">Willing to do cross-border shipments</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Preferred Routes</CardTitle>
                    <CardDescription>
                        Specific city-to-city routes you run regularly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Input
                            placeholder="From City"
                            value={newRouteFrom}
                            onChange={(e) => setNewRouteFrom(e.target.value)}
                        />
                        <Input
                            placeholder="To City"
                            value={newRouteTo}
                            onChange={(e) => setNewRouteTo(e.target.value)}
                        />
                        <Button type="button" variant="outline" onClick={handleAddRoute} disabled={loading}>
                            <Plus className="w-4 h-4 mr-2" /> Add
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {preferredRoutes.map(route => (
                            <div key={route.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div className="font-medium">
                                    {route.from_city} <span className="mx-2 text-muted-foreground">→</span> {route.to_city}
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteRoute(route.id)}
                                    disabled={loading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        {preferredRoutes.length === 0 && (
                            <p className="text-sm text-center text-muted-foreground py-4 border border-dashed rounded-lg">
                                No preferred routes added yet.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Freight & Capabilities</CardTitle>
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

                    <div className="space-y-4 border-t pt-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
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

                </CardContent>
                <CardFooter className="flex justify-end p-6 bg-muted/30">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Service Configuration
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
