"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MileageLog } from "@/app/actions/driver-expense-actions";
import { MapPin } from "lucide-react";
import { format } from "date-fns";

interface MileageLogListProps {
    logs: MileageLog[];
}

export function MileageLogList({ logs }: MileageLogListProps) {
    if (logs.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-semibold">No mileage logs yet</h3>
                <p className="text-sm text-muted-foreground">Keep track of your distance for accurate reimbursements.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead className="text-right">Distance</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="text-xs font-medium">
                                {format(new Date(log.trip_date), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-xs">{log.start_odometer} km</TableCell>
                            <TableCell className="text-xs">{log.end_odometer} km</TableCell>
                            <TableCell className="text-right font-bold text-primary">
                                {log.total_distance} km
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
