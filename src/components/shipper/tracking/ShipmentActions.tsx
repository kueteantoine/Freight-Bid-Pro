"use client";

import { ShipmentWithDetails } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import {
    MessageSquare,
    Edit,
    AlertTriangle,
    XCircle,
    Download
} from "lucide-react";
import { useState } from "react";

interface ShipmentActionsProps {
    shipment: ShipmentWithDetails;
}

export function ShipmentActions({ shipment }: ShipmentActionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const canMessage = shipment.status === "in_transit" || shipment.status === "bid_awarded";
    const canModify = shipment.status !== "delivered" && shipment.status !== "cancelled";
    const canCancel = shipment.status !== "delivered" && shipment.status !== "cancelled";

    return (
        <div className="flex flex-wrap gap-2">
            {canMessage && (
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                </Button>
            )}

            {canModify && (
                <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Request Change
                </Button>
            )}

            <Button variant="outline" size="sm" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Report Issue
            </Button>

            <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Documents
            </Button>

            {canCancel && (
                <Button variant="destructive" size="sm" className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Cancel
                </Button>
            )}
        </div>
    );
}
