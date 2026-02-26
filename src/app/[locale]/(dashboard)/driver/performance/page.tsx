import { Suspense } from "react";
import {
    getDriverPerformanceMetrics,
    getDriverRatings,
    getDriverAchievements,
    getDriverGoals,
    getDriverStatsExtremes
} from "@/app/actions/driver-performance-actions";
import { PerformanceOverview } from "@/components/driver/performance/PerformanceOverview";
import { RatingBreakdown } from "@/components/driver/performance/RatingBreakdown";
import { AchievementsGallery } from "@/components/driver/performance/AchievementsGallery";
import { GoalTracker } from "@/components/driver/performance/GoalTracker";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap, TrendingUp } from "lucide-react";

export const metadata = {
    title: "Performance & Ratings | Freight Bid Pro",
    description: "Track your driving performance, ratings, and achievements.",
};

export default async function DriverPerformancePage() {
    // Parallel data fetching for performance boost
    const [metrics, ratingData, achievements, goals, extremes] = await Promise.all([
        getDriverPerformanceMetrics(),
        getDriverRatings(),
        getDriverAchievements(),
        getDriverGoals(),
        getDriverStatsExtremes()
    ]);

    return (
        <div className="space-y-6 pb-20">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Performance</h1>
                    <p className="text-xs text-muted-foreground">Monitor your success and driver stats</p>
                </div>
                <div className="bg-blue-600 p-2 rounded-full text-white shadow-lg shadow-blue-200">
                    <TrendingUp className="h-5 w-5" />
                </div>
            </header>

            {/* Overall Stats Grid */}
            <PerformanceOverview metrics={metrics} />

            {/* Personal Records Banner */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-blue-200">
                <CardContent className="p-4 flex items-center space-x-4">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-semibold opacity-80 uppercase tracking-wider">Top Achievement</div>
                        <div className="text-sm font-bold">
                            Highest Earning Trip: {extremes.highest_earning_trip.toLocaleString()} XAF
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Achievements Section */}
            <AchievementsGallery achievements={achievements} />

            {/* Goals Section */}
            <GoalTracker goals={goals} />

            {/* Ratings Breakdown Section */}
            <RatingBreakdown data={ratingData} />

            {/* Trip Records Detail */}
            <div className="space-y-3">
                <h3 className="font-semibold text-lg px-1">Trip Records</h3>
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Most Frequent Route</span>
                            <span className="text-sm font-medium">{extremes.most_frequent_route}</span>
                        </div>
                        <div className="h-px bg-muted w-full" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Longest Single Trip</span>
                            <span className="text-sm font-medium">{extremes.longest_trip ? `${extremes.longest_trip} km` : "N/A"}</span>
                        </div>
                        <div className="h-px bg-muted w-full" />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">All-time Trips</span>
                            <span className="text-sm font-medium">{metrics.total_trips}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
