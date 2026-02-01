"use client";

import { Shipment, TrackingEvent } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MilestoneProgressProps {
    shipment: Shipment;
}

const milestones: { event: TrackingEvent; label: string }[] = [
    { event: "shipment_created", label: "Created" },
    { event: "bid_awarded", label: "Awarded" },
    { event: "driver_assigned", label: "Assigned" },
    { event: "loaded", label: "Loaded" },
    { event: "in_transit", label: "In Transit" },
    { event: "delivered", label: "Delivered" },
];

export function MilestoneProgress({ shipment }: MilestoneProgressProps) {
    // Determine current milestone index based on status
    const getCurrentMilestoneIndex = () => {
        switch (shipment.status) {
            case "draft":
            case "open_for_bidding":
                return 0;
            case "bid_awarded":
                return shipment.assigned_driver_user_id ? 2 : 1;
            case "in_transit":
                return 4;
            case "delivered":
                return 5;
            case "cancelled":
                return -1;
            default:
                return 0;
        }
    };

    const currentIndex = getCurrentMilestoneIndex();

    if (shipment.status === "cancelled") {
        return (
            <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <CardContent className="py-4">
                    <p className="text-center text-red-600 dark:text-red-400 font-medium">
                        This shipment has been cancelled
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="py-6">
                <div className="relative">
                    {/* Progress bar background */}
                    <div className="absolute top-5 left-0 right-0 h-1 bg-muted" />

                    {/* Progress bar fill */}
                    <div
                        className="absolute top-5 left-0 h-1 bg-primary transition-all duration-500"
                        style={{ width: `${(currentIndex / (milestones.length - 1)) * 100}%` }}
                    />

                    {/* Milestones */}
                    <div className="relative flex justify-between">
                        {milestones.map((milestone, index) => {
                            const isCompleted = index <= currentIndex;
                            const isCurrent = index === currentIndex;

                            return (
                                <div key={milestone.event} className="flex flex-col items-center">
                                    {/* Icon */}
                                    <div
                                        className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                                            isCompleted
                                                ? "bg-primary border-primary"
                                                : "bg-background border-muted",
                                            isCurrent && "ring-4 ring-primary/20"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <div className="mt-2 text-center">
                                        <p
                                            className={cn(
                                                "text-xs font-medium",
                                                isCompleted ? "text-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            {milestone.label}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ETA Display */}
                {shipment.status === "in_transit" && shipment.estimated_arrival && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                        <p className="text-lg font-bold text-primary">
                            {new Date(shipment.estimated_arrival).toLocaleString()}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
