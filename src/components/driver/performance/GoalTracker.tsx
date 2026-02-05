"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Target, CheckCircle } from "lucide-react";

interface GoalTrackerProps {
    goals: any[];
}

export function GoalTracker({ goals }: GoalTrackerProps) {
    const [showAddGoal, setShowAddGoal] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-lg">Personal Goals</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddGoal(!showAddGoal)} className="h-8 text-blue-600 px-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Goal
                </Button>
            </div>

            <div className="space-y-3">
                {goals.length > 0 ? (
                    goals.map((goal) => {
                        const progress = (goal.current_value / goal.target_value) * 100;
                        const isCompleted = progress >= 100;

                        return (
                            <Card key={goal.id} className="overflow-hidden">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-lg ${isCompleted ? "bg-emerald-100" : "bg-blue-100"}`}>
                                                {isCompleted ? (
                                                    <CheckCircle className={`h-4 w-4 text-emerald-600`} />
                                                ) : (
                                                    <Target className={`h-4 w-4 text-blue-600`} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold capitalize">
                                                    {goal.goal_type} Goal
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    Ends on {new Date(goal.end_date).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold">
                                                {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {Math.min(100, Math.round(progress))}% completed
                                            </div>
                                        </div>
                                    </div>
                                    <Progress value={progress} className={`h-2 ${isCompleted ? "bg-emerald-100" : ""}`} />
                                </CardContent>
                            </Card>
                        );
                    })
                ) : (
                    <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed text-sm">
                        No active goals. Set a target to stay motivated!
                    </div>
                )}
            </div>
        </div>
    );
}
