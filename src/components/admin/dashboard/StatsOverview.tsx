'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Gavel, DollarSign, Activity, AlertCircle } from "lucide-react";

interface DashboardStats {
    active_users: number;
    active_shipments: number;
    active_bids: number;
    transactions_today_count: number;
    transactions_today_value: number;
    pending_verifications: number;
    open_disputes: number;
}

interface StatsOverviewProps {
    stats: DashboardStats;
    currency?: string;
}

export function StatsOverview({ stats, currency = 'XAF' }: StatsOverviewProps) {
    const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: any, description?: string }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Active Users"
                value={stats.active_users}
                icon={Users}
                description="Users with active roles"
            />
            <StatCard
                title="Active Shipments"
                value={stats.active_shipments}
                icon={Package}
                description="Open or in transit"
            />
            <StatCard
                title="Active Bids"
                value={stats.active_bids}
                icon={Gavel}
                description="Live auctions"
            />
            <StatCard
                title="Today's Revenue"
                value={`${new Intl.NumberFormat('fr-CM', { style: 'currency', currency }).format(stats.transactions_today_value)}`}
                icon={DollarSign}
                description={`${stats.transactions_today_count} transactions today`}
            />
            <StatCard
                title="Pending Verifications"
                value={stats.pending_verifications}
                icon={Activity}
                description="Users waiting for approval"
            />
            <StatCard
                title="Open Disputes"
                value={stats.open_disputes}
                icon={AlertCircle}
                description="Refund requests pending"
            />
        </div>
    );
}
