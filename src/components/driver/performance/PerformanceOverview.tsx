import { Card, CardContent } from "@/components/ui/card";
import { Truck, MapPin, DollarSign, Star, Award, CheckCircle2 } from "lucide-react";
import { DriverPerformanceMetrics } from "@/app/actions/driver-performance-actions";

interface PerformanceOverviewProps {
    metrics: DriverPerformanceMetrics;
}

export function PerformanceOverview({ metrics }: PerformanceOverviewProps) {
    const kpis = [
        {
            label: "Total Trips",
            value: metrics.total_trips,
            icon: Truck,
            color: "text-blue-500",
            bgColor: "bg-blue-50",
        },
        {
            label: "Distance (km)",
            value: metrics.total_distance.toLocaleString(),
            icon: MapPin,
            color: "text-purple-500",
            bgColor: "bg-purple-50",
        },
        {
            label: "Total Earnings",
            value: `${metrics.total_earnings.toLocaleString()} XAF`,
            icon: DollarSign,
            color: "text-emerald-500",
            bgColor: "bg-emerald-50",
        },
        {
            label: "Avg. Rating",
            value: metrics.avg_rating,
            icon: Star,
            color: "text-amber-500",
            bgColor: "bg-amber-50",
        },
        {
            label: "On-time Rate",
            value: `${metrics.on_time_rate}%`,
            icon: CheckCircle2,
            color: "text-indigo-500",
            bgColor: "bg-indigo-50",
        },
        {
            label: "Local Rank",
            value: `#${metrics.rank}`,
            icon: Award,
            color: "text-orange-500",
            bgColor: "bg-orange-50",
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {kpis.map((kpi) => (
                <Card key={kpi.label} className="border-none shadow-sm overflow-hidden">
                    <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                        <div className={`p-2 rounded-full ${kpi.bgColor}`}>
                            <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                        </div>
                        <div>
                            <div className="text-lg font-bold">{kpi.value}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                                {kpi.label}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
