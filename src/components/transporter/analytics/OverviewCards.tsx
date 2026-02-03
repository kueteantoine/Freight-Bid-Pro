import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, Trophy, Clock, Star } from "lucide-react";

interface KPIProps {
    data: {
        total_shipments: number;
        total_revenue: number;
        bid_win_rate: number;
        on_time_rate: number;
        avg_rating: number;
    };
}

export function OverviewCards({ data }: KPIProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.total_shipments}</div>
                    <p className="text-xs text-muted-foreground">Competed shipments</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('fr-CM', { style: 'currency', currency: 'XAF' }).format(data.total_revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">Net earnings</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bid Win Rate</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.bid_win_rate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Bids awarded</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.on_time_rate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Delivery performance</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{data.avg_rating.toFixed(1)}</div>
                    <p className="text-xs text-muted-foreground">Customer satisfaction</p>
                </CardContent>
            </Card>
        </div>
    );
}
