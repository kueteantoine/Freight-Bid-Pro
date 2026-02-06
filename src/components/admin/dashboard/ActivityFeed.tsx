'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Package, Gavel, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
    timestamp: string;
    type: 'user_registration' | 'new_shipment' | 'new_bid' | 'payment_completed';
    details: any;
}

interface ActivityFeedProps {
    activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'user_registration': return <UserPlus className="h-4 w-4 text-blue-500" />;
            case 'new_shipment': return <Package className="h-4 w-4 text-orange-500" />;
            case 'new_bid': return <Gavel className="h-4 w-4 text-purple-500" />;
            case 'payment_completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            default: return <UserPlus className="h-4 w-4" />;
        }
    };

    const getDescription = (activity: Activity) => {
        switch (activity.type) {
            case 'user_registration':
                return `New user registered: ${activity.details.email || 'Unknown'}`;
            case 'new_shipment':
                return `New shipment posted: ${activity.details.shipment_number || 'Unknown'}`;
            case 'new_bid':
                return `New bid of ${new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(activity.details.amount)} placed`;
            case 'payment_completed':
                return `Payment of ${new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(activity.details.amount)} completed`;
            default:
                return 'Unknown activity';
        }
    };

    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                    ) : (
                        activities.map((activity, index) => (
                            <div key={index} className="flex items-center">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted">
                                    {getIcon(activity.type)}
                                </div>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {getDescription(activity)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
