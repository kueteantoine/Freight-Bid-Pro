"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, Package, DollarSign, ChevronRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DriverJob } from "@/app/actions/driver-jobs";

interface JobCardProps {
    job: DriverJob;
}

export function JobCard({ job }: JobCardProps) {
    const isPending = job.status === "pending";

    return (
        <Link href={`/driver/jobs/${job.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer mb-4">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-lg">{job.shipment.shipment_number}</h3>
                            <p className="text-sm text-muted-foreground">
                                {job.shipper?.company_name || "Unknown Shipper"}
                            </p>
                        </div>
                        <Badge variant={isPending ? "secondary" : "default"} className={isPending ? "bg-yellow-100 text-yellow-800" : ""}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium">Pickup</p>
                            <p className="text-muted-foreground line-clamp-1">{job.shipment.pickup_location}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {format(new Date(job.shipment.scheduled_pickup_date), "MMM d, h:mm a")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-primary mt-1 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium">Delivery</p>
                            <p className="text-muted-foreground line-clamp-1">{job.shipment.delivery_location}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {job.shipment.scheduled_delivery_date
                                    ? format(new Date(job.shipment.scheduled_delivery_date), "MMM d, h:mm a")
                                    : "TBD"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                        <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>{job.shipment.freight_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span>{job.shipment.weight_kg}kg</span>
                        </div>
                        {/* Mock Price for now - typically comes from payment or offer details */}
                        <div className="flex items-center gap-1 ml-auto font-semibold text-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>150,000 XAF</span>
                        </div>
                    </div>
                </CardContent>
                {/* <CardFooter className="pt-0">
                    <Button className="w-full" variant="outline">
                        View Details
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </CardFooter> */}
            </Card>
        </Link>
    );
}
