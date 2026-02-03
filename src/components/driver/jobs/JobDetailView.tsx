"use client";

import { DriverJob } from "@/app/actions/driver-jobs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Truck, Package, Phone, Navigation, Info } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface JobDetailViewProps {
    job: DriverJob;
}

export function JobDetailView({ job }: JobDetailViewProps) {
    return (
        <div className="pb-24 space-y-4">
            {/* Header / Status */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{job.shipment.shipment_number}</h1>
                    <p className="text-muted-foreground">{job.shipper?.company_name}</p>
                </div>
                <Badge variant={job.status === 'pending' ? 'secondary' : 'default'} className="text-base px-3 py-1">
                    {job.status}
                </Badge>
            </div>

            {/* Map Preview Placeholder */}
            {/* In a real app, this would be an interactive map showing the route */}
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Map Preview
                    </span>
                </div>
                {/* Distance overlay */}
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                    Est. Distance: 345 km
                </div>
                <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
                    Est. Duration: 5h 30m
                </div>
            </div>

            {/* Route Details */}
            <Card>
                <CardContent className="pt-6 space-y-6">
                    <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
                        {/* Pickup */}
                        <div className="relative">
                            <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                            <div>
                                <h3 className="font-semibold text-base mb-1">Pickup</h3>
                                <p className="text-sm text-foreground/90">{job.shipment.pickup_location}</p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {format(new Date(job.shipment.scheduled_pickup_date), "EEEE, MMM d")}
                                    </span>
                                    <span className="text-primary font-medium">
                                        {format(new Date(job.shipment.scheduled_pickup_date), "h:mm a")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery */}
                        <div className="relative">
                            <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-primary bg-primary" />
                            <div>
                                <h3 className="font-semibold text-base mb-1">Delivery</h3>
                                <p className="text-sm text-foreground/90">{job.shipment.delivery_location}</p>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {job.shipment.scheduled_delivery_date
                                            ? format(new Date(job.shipment.scheduled_delivery_date), "EEEE, MMM d")
                                            : "Date TBD"}
                                    </span>
                                    <span className="text-primary font-medium">
                                        {job.shipment.scheduled_delivery_date
                                            ? format(new Date(job.shipment.scheduled_delivery_date), "h:mm a")
                                            : "Time TBD"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Freight Details */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Freight Details
                    </h3>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground">Type</p>
                            <p className="font-medium text-sm">{job.shipment.freight_type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Weight</p>
                            <p className="font-medium text-sm">{job.shipment.weight_kg} kg</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Dimensions</p>
                            <p className="font-medium text-sm">
                                {job.shipment.dimensions_json?.length || 0}x
                                {job.shipment.dimensions_json?.width || 0}x
                                {job.shipment.dimensions_json?.height || 0} cm
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Special Handling</p>
                            <p className="font-medium text-sm">{job.shipment.special_handling_requirements || "None"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Vehicle Requirements */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Vehicle Requirements
                    </h3>
                    <Separator />
                    <div className="bg-muted/30 p-3 rounded-lg flex items-center gap-3">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">Any {job.shipment.freight_type} compatible truck</span>
                    </div>
                </CardContent>
            </Card>

            {/* Shipper Contact (Only if accepted) */}
            {['accepted', 'in_progress', 'completed'].includes(job.status) && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            Shipper Contact
                        </h3>
                        <Separator />
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-medium">{job.shipper?.company_name}</p>
                                <p className="text-sm text-muted-foreground">Logistics Manager</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:+1234567890`}>
                                Call
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
