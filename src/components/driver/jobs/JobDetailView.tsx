"use client";

import { DriverJob } from "@/app/actions/driver-jobs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Truck, Package, Phone, Navigation, Info, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DocumentSection } from "../documents/DocumentSection";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BOLView } from "../documents/BOLView";

interface JobDetailViewProps {
    job: DriverJob;
}

export function JobDetailView({ job }: JobDetailViewProps) {
    const [showBOL, setShowBOL] = useState(false);

    return (
        <div className="pb-24 space-y-6">
            {/* Header / Status */}
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold">{job.shipment.shipment_number}</h1>
                    <p className="text-muted-foreground">{job.shipper?.company_name}</p>
                </div>
                <Badge
                    variant={['completed', 'delivered'].includes(job.status) ? 'default' : 'secondary'}
                    className="text-base px-3 py-1"
                >
                    {job.status === 'delivered' ? 'Completed' : job.status}
                </Badge>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1 gap-2 shadow-sm"
                    onClick={() => setShowBOL(true)}
                >
                    <FileText className="h-4 w-4" />
                    Digital BOL
                </Button>
                {['accepted', 'in_progress'].includes(job.status) && (
                    <Link href={`/driver/navigation?jobId=${job.shipment_id}`} className="flex-1">
                        <Button className="w-full gap-2 shadow-md">
                            <Navigation className="h-4 w-4" />
                            Navigate
                        </Button>
                    </Link>
                )}
            </div>

            {/* Map Preview Placeholder */}
            <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner border">
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Map Preview
                    </span>
                </div>

                {/* Status Specific Overlay */}
                {job.status === 'delivered' && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-white/90 dark:bg-slate-900/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="font-bold text-green-700 dark:text-green-400">Delivered Successfully</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Sections - Using simple grid for key details */}
            <div className="grid grid-cols-1 gap-4">
                {/* Route Details */}
                <Card className="rounded-2xl border-none shadow-sm bg-muted/30">
                    <CardContent className="pt-6 space-y-6">
                        <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
                            {/* Pickup */}
                            <div className="relative">
                                <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pickup</h3>
                                    <p className="text-sm font-medium mt-1">{job.shipment.pickup_location}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {format(new Date(job.shipment.scheduled_pickup_date), "EEEE, MMM d 'at' h:mm a")}
                                    </p>
                                </div>
                            </div>

                            {/* Delivery */}
                            <div className="relative">
                                <span className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-primary bg-primary" />
                                <div>
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Delivery</h3>
                                    <p className="text-sm font-medium mt-1">{job.shipment.delivery_location}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {job.shipment.scheduled_delivery_date
                                            ? format(new Date(job.shipment.scheduled_delivery_date), "EEEE, MMM d 'at' h:mm a")
                                            : "Date TBD"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents & POD Section - Only if accepted or delivered */}
                {['accepted', 'in_progress', 'delivered'].includes(job.status) && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-bold px-1">Documents & POD</h2>
                        <DocumentSection job={job} />
                    </div>
                )}

                {/* Freight Details */}
                <Card className="rounded-2xl border-none shadow-sm">
                    <CardContent className="pt-6 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Freight Details
                        </h3>
                        <Separator className="opacity-50" />
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Cargo Type</p>
                                <p className="font-medium text-sm">{job.shipment.freight_type}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Total Weight</p>
                                <p className="font-medium text-sm">{job.shipment.weight_kg} kg</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Dimensions (LxWxH)</p>
                                <p className="font-medium text-sm">
                                    {job.shipment.dimensions_json?.length || 0}x
                                    {job.shipment.dimensions_json?.width || 0}x
                                    {job.shipment.dimensions_json?.height || 0} cm
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* BOL Dialog */}
            <Dialog open={showBOL} onOpenChange={setShowBOL}>
                <DialogContent className="max-w-[100vw] h-[100dvh] p-0 sm:max-w-2xl sm:h-auto sm:rounded-3xl overflow-y-auto">
                    <DialogHeader className="p-4 border-b sm:hidden">
                        <DialogTitle>Digital Bill of Lading</DialogTitle>
                    </DialogHeader>
                    <BOLView shipmentId={job.shipment_id} onClose={() => setShowBOL(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
