"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { driverService } from "@/lib/services/driver-service";
import { ShiftLog } from "@/lib/types/database";
import { format } from "date-fns";
import { Coins, Clock, Briefcase } from "lucide-react";

export function ShiftSummary() {
    const [shift, setShift] = useState<ShiftLog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadShift();
    }, []);

    const loadShift = async () => {
        try {
            const data = await driverService.getShiftSummary();
            setShift(data);
        } catch (error) {
            console.error("Error loading shift summary:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="h-32 bg-muted/20 animate-pulse rounded-lg" />;
    }

    if (!shift) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No recent shifts found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Last Shift Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Started</span>
                    </div>
                    <span className="font-medium">
                        {format(new Date(shift.shift_start), "MMM d, h:mm a")}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        <span>Jobs Completed</span>
                    </div>
                    <span className="font-medium">{shift.jobs_completed}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Coins className="w-4 h-4" />
                        <span>Earnings</span>
                    </div>
                    <span className="font-bold text-green-600">
                        {new Intl.NumberFormat("fr-CM", {
                            style: "currency",
                            currency: "XAF",
                        }).format(shift.total_earnings)}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
