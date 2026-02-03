"use client";

import { DriverJob } from "@/app/actions/driver-jobs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface JobHistoryListProps {
    jobs: DriverJob[];
}

export function JobHistoryList({ jobs }: JobHistoryListProps) {
    if (jobs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>No job history found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {jobs.map((job) => (
                <div key={job.id} className="flex gap-4 p-4 border rounded-lg bg-card text-card-foreground">
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">{job.shipment.shipment_number}</p>
                            <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                                {job.status}
                            </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="mr-1 h-3 w-3" />
                            {job.shipment.pickup_location} → {job.shipment.delivery_location}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {format(new Date(job.assigned_at), "MMM d, yyyy")}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
