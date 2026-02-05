"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
    Award,
    Gift,
    ChevronRight,
    ArrowLeft,
    CheckCircle2,
    Timer
} from "lucide-react";

interface IncentiveProgressProps {
    incentives: any[];
    onBack: () => void;
}

export const IncentiveProgress: React.FC<IncentiveProgressProps> = ({
    incentives,
    onBack
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-xl font-bold">Bonus & Incentives</h2>
            </div>

            {incentives.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                    <Award className="w-16 h-16 opacity-10 mb-4" />
                    <p className="font-medium">No active bonuses</p>
                    <p className="text-sm">Check back later for new opportunities!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {incentives.map((i) => {
                        const progress = (i.current_value / i.target_value) * 100;
                        const isExpired = i.expires_at && new Date(i.expires_at) < new Date();

                        return (
                            <div key={i.id} className="bg-accent/40 rounded-3xl p-5 space-y-4 border border-border/50">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <Gift className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm">{i.goal_name}</h3>
                                            <p className="text-xs text-muted-foreground">{i.description || 'Target achieved via completed trips'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-orange-600 dark:text-orange-400">{formatCurrency(i.reward_amount)}</p>
                                        <p className="text-[10px] text-muted-foreground">REWARD</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span>Progress</span>
                                        <span>{i.current_value} / {i.target_value} trips</span>
                                    </div>
                                    <Progress value={progress} className="h-2 bg-accent" />
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Timer className="w-3.5 h-3.5" />
                                        <span>Expires in 3 days</span>
                                    </div>
                                    {i.current_value >= i.target_value ? (
                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Ready to Claim
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px]">IN PROGRESS</Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Gamification Note */}
            <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-4 rounded-2xl border-l-4 border-orange-500">
                <p className="text-xs font-medium text-orange-700 dark:text-orange-400">
                    Pro-tip: Focus on high-demand routes to unlock these bonuses faster!
                </p>
            </div>
        </div>
    );
};

// Re-using Badge locally as it might not be exported precisely this way
const Badge = ({ children, className, variant = "default" }: any) => {
    const variants: any = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border text-foreground",
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
