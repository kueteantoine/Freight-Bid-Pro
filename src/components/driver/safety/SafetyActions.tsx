"use client";

import { EmergencyButton } from "./EmergencyButton";
import { DelayReportDialog } from "./DelayReportDialog";
import { IncidentReportDialog } from "./IncidentReportDialog";
import { BreakdownReportDialog } from "./BreakdownReportDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface SafetyActionsProps {
    shipmentId?: string;
    vehicleId?: string;
    className?: string;
}

export function SafetyActions({ shipmentId, vehicleId, className }: SafetyActionsProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Safety & Emergency
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center py-2">
                    <EmergencyButton shipmentId={shipmentId} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {shipmentId && (
                        <>
                            <DelayReportDialog shipmentId={shipmentId} />
                            <IncidentReportDialog shipmentId={shipmentId} />
                        </>
                    )}
                    <BreakdownReportDialog
                        shipmentId={shipmentId}
                        vehicleId={vehicleId}
                    />
                    {!shipmentId && (
                        <div className="col-span-2 text-xs text-muted-foreground flex items-center justify-center text-center p-2 border border-dashed rounded-md">
                            Assign to a shipment to enable full safety reporting
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
