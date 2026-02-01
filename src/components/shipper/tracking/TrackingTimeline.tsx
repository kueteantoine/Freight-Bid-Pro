"use client";

import { ShipmentTrackingWithUser, TrackingEvent } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    TrendingUp,
    UserCheck,
    Loader,
    Truck,
    CheckCircle2,
    XCircle,
    MapPin
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TrackingTimelineProps {
    events: ShipmentTrackingWithUser[];
}

const eventConfig: Record<TrackingEvent, { icon: React.ElementType; color: string; label: string }> = {
    shipment_created: { icon: Package, color: "text-blue-600", label: "Shipment Created" },
    bid_awarded: { icon: TrendingUp, color: "text-purple-600", label: "Bid Awarded" },
    driver_assigned: { icon: UserCheck, color: "text-indigo-600", label: "Driver Assigned" },
    pickup_started: { icon: MapPin, color: "text-orange-600", label: "Pickup Started" },
    loaded: { icon: Loader, color: "text-yellow-600", label: "Loaded" },
    in_transit: { icon: Truck, color: "text-green-600", label: "In Transit" },
    delivered: { icon: CheckCircle2, color: "text-emerald-600", label: "Delivered" },
    cancelled: { icon: XCircle, color: "text-red-600", label: "Cancelled" },
};

export function TrackingTimeline({ events }: TrackingTimelineProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tracking Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative space-y-6">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                    {events.map((event, index) => {
                        const config = eventConfig[event.tracking_event];
                        const Icon = config.icon;
                        const isFirst = index === 0;

                        return (
                            <div key={event.id} className="relative flex gap-4">
                                {/* Icon */}
                                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background ${isFirst ? 'bg-primary' : 'bg-muted'}`}>
                                    <Icon className={`h-4 w-4 ${isFirst ? 'text-primary-foreground' : config.color}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold">{config.label}</h4>
                                                {isFirst && <Badge variant="default">Latest</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDistanceToNow(new Date(event.event_timestamp), { addSuffix: true })}
                                            </p>
                                            {event.notes && (
                                                <p className="text-sm mt-2">{event.notes}</p>
                                            )}
                                            {event.location_name && (
                                                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    {event.location_name}
                                                </div>
                                            )}
                                            {event.profiles && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    By {event.profiles.first_name} {event.profiles.last_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(event.event_timestamp).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Images */}
                                    {event.images_json && event.images_json.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                            {event.images_json.map((image, idx) => (
                                                <img
                                                    key={idx}
                                                    src={image}
                                                    alt={`Event image ${idx + 1}`}
                                                    className="h-20 w-20 rounded object-cover border"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {events.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No tracking events yet
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
