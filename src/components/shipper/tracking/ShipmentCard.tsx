"use client";

import { Shipment, ShipmentStatus } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Calendar,
    Package,
    TrendingUp,
    Eye,
    MessageSquare,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ShipmentCardProps {
    shipment: Shipment;
}

const statusConfig: Record<ShipmentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
    draft: { label: "Draft", variant: "outline", color: "text-gray-500" },
    open_for_bidding: { label: "Open for Bidding", variant: "default", color: "text-blue-600" },
    bid_awarded: { label: "Bid Awarded", variant: "secondary", color: "text-purple-600" },
    in_transit: { label: "In Transit", variant: "default", color: "text-green-600" },
    delivered: { label: "Delivered", variant: "secondary", color: "text-emerald-600" },
    cancelled: { label: "Cancelled", variant: "destructive", color: "text-red-600" },
};

export function ShipmentCard({ shipment }: ShipmentCardProps) {
    const statusInfo = statusConfig[shipment.status];
    const bidCount = shipment.bids?.length || 0;
    const lowestBid = shipment.bids?.length
        ? Math.min(...shipment.bids.map(b => b.bid_amount))
        : null;

    return (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{shipment.shipment_number}</h3>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Created {formatDistanceToNow(new Date(shipment.created_at), { addSuffix: true })}
                        </p>
                    </div>
                    {shipment.status === "open_for_bidding" && bidCount > 0 && (
                        <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{bidCount}</div>
                            <div className="text-xs text-muted-foreground">
                                {bidCount === 1 ? "Bid" : "Bids"}
                            </div>
                        </div>
                    )}
                </div>

                {/* Route */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Pickup</p>
                            <p className="text-sm text-muted-foreground">{shipment.pickup_location}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">Delivery</p>
                            <p className="text-sm text-muted-foreground">{shipment.delivery_location}</p>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Pickup Date</p>
                            <p className="text-sm font-medium">
                                {new Date(shipment.scheduled_pickup_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Freight</p>
                            <p className="text-sm font-medium">{shipment.freight_type}</p>
                        </div>
                    </div>
                </div>

                {/* Bid Info */}
                {shipment.status === "open_for_bidding" && lowestBid && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                            <p className="text-xs text-muted-foreground">Lowest Bid</p>
                            <p className="text-sm font-bold text-green-600">
                                {lowestBid.toLocaleString()} XAF
                            </p>
                        </div>
                    </div>
                )}

                {/* Progress for in-transit */}
                {shipment.status === "in_transit" && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">In Transit</span>
                            {shipment.estimated_arrival && (
                                <span className="font-medium">
                                    ETA: {new Date(shipment.estimated_arrival).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Link href={`/shipper/shipments/${shipment.id}`} className="flex-1">
                        <Button variant="default" className="w-full gap-2">
                            <Eye className="h-4 w-4" />
                            View Details
                        </Button>
                    </Link>
                    {(shipment.status === "in_transit" || shipment.status === "bid_awarded") && (
                        <Button variant="outline" size="icon">
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
