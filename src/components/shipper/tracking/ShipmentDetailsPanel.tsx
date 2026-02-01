"use client";

import { ShipmentWithDetails } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    MapPin,
    Calendar,
    Package,
    Truck,
    User,
    Phone,
    Star,
    Shield,
    FileText
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShipmentDetailsPanelProps {
    shipment: ShipmentWithDetails;
}

export function ShipmentDetailsPanel({ shipment }: ShipmentDetailsPanelProps) {
    return (
        <div className="space-y-4">
            {/* Shipment Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Shipment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Pickup</p>
                                <p className="text-sm font-medium">{shipment.pickup_location}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(shipment.scheduled_pickup_date).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Delivery</p>
                                <p className="text-sm font-medium">{shipment.delivery_location}</p>
                                {shipment.scheduled_delivery_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(shipment.scheduled_delivery_date).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Freight Type</p>
                            <div className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                <p className="text-sm font-medium">{shipment.freight_type}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Weight</p>
                            <p className="text-sm font-medium">{shipment.weight_kg} kg</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                            <p className="text-sm font-medium">{shipment.quantity}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Vehicle Type</p>
                            <div className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                <p className="text-sm font-medium">{shipment.preferred_vehicle_type || "Any"}</p>
                            </div>
                        </div>
                    </div>

                    {shipment.insurance_required && (
                        <>
                            <Separator />
                            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded">
                                <Shield className="h-4 w-4 text-blue-600" />
                                <div>
                                    <p className="text-xs font-medium">Insurance Covered</p>
                                    <p className="text-xs text-muted-foreground">
                                        Value: {shipment.insurance_value.toLocaleString()} XAF
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {shipment.special_handling_requirements && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Special Requirements</p>
                                <p className="text-sm">{shipment.special_handling_requirements}</p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Transporter Information */}
            {shipment.transporter_profile && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Transporter Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={shipment.transporter_profile.avatar_url || undefined} />
                                <AvatarFallback>
                                    {shipment.transporter_profile.first_name?.[0]}
                                    {shipment.transporter_profile.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-medium">
                                    {shipment.transporter_profile.first_name} {shipment.transporter_profile.last_name}
                                </p>
                                {shipment.transporter_profile.company_name && (
                                    <p className="text-sm text-muted-foreground">
                                        {shipment.transporter_profile.company_name}
                                    </p>
                                )}
                            </div>
                            <Badge variant={shipment.transporter_profile.verification_status === "verified" ? "default" : "secondary"}>
                                {shipment.transporter_profile.verification_status}
                            </Badge>
                        </div>

                        {shipment.transporter_profile.overall_rating > 0 && (
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{shipment.transporter_profile.overall_rating.toFixed(1)}</span>
                                <span className="text-sm text-muted-foreground">
                                    ({shipment.transporter_profile.total_reviews} reviews)
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Driver Information */}
            {shipment.driver_profile && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Driver Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={shipment.driver_profile.avatar_url || undefined} />
                                <AvatarFallback>
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="font-medium">
                                    {shipment.driver_profile.first_name} {shipment.driver_profile.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">Assigned Driver</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payment Information */}
            {shipment.bids && shipment.bids.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Bid Amount</span>
                            <span className="font-bold text-lg">
                                {Math.min(...shipment.bids.map(b => b.bid_amount)).toLocaleString()} XAF
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant="outline">Pending Payment</Badge>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
