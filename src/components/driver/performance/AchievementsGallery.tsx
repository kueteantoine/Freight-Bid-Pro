import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Trophy } from "lucide-react";
import { format } from "date-fns";

interface AchievementsGalleryProps {
    achievements: any[];
}

export function AchievementsGallery({ achievements }: AchievementsGalleryProps) {
    // Common milestones that could be earned
    const possibleAchievements = [
        { key: "trips_10", title: "Rookie", description: "Complete 10 trips", icon: "🥉" },
        { key: "trips_50", title: "Professional", description: "Complete 50 trips", icon: "🥈" },
        { key: "trips_100", title: "Veteran", description: "Complete 100 trips", icon: "🥇" },
        { key: "perfect_month", title: "Perfect Month", description: "100% on-time for a month", icon: "⭐" },
        { key: "five_star", title: "Star Driver", description: "Maintain 5-star rating for 10 trips", icon: "💎" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-lg">Achievements</h3>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    <Trophy className="h-3 w-3 mr-1" />
                    {achievements.length} Earned
                </Badge>
            </div>

            <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
                {possibleAchievements.map((item) => {
                    const earned = achievements.find((a) => a.achievement_key === item.key);
                    return (
                        <Card
                            key={item.key}
                            className={`flex-shrink-0 w-32 ${earned ? "border-amber-200 bg-amber-50/30" : "opacity-50 bg-muted/20"
                                }`}
                        >
                            <CardContent className="p-3 flex flex-col items-center text-center space-y-2">
                                <div className="text-3xl filter drop-shadow-sm">
                                    {earned ? item.icon : <Lock className="h-8 w-8 text-muted-foreground p-1" />}
                                </div>
                                <div className="space-y-0.5">
                                    <div className={`text-xs font-bold leading-tight ${earned ? "text-amber-900" : "text-muted-foreground"}`}>
                                        {item.title}
                                    </div>
                                    <div className="text-[9px] text-muted-foreground leading-tight">
                                        {earned ? `Earned ${format(new Date(earned.earned_at), "MMM yyyy")}` : item.description}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
