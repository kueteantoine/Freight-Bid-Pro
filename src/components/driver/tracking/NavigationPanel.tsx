"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Navigation2, Ruler, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationPanelProps {
    eta: string;
    distanceRemaining: string;
    nextInstruction?: string;
    onCallShipper?: () => void;
    onReportIssue?: () => void;
}

export function NavigationPanel({
    eta,
    distanceRemaining,
    nextInstruction = "Drive safe!",
    onCallShipper,
    onReportIssue
}: NavigationPanelProps) {
    return (
        <div className="fixed bottom-24 left-4 right-4 z-20">
            <Card className="shadow-2xl border-2 border-primary/10">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase">ETA</p>
                                <p className="text-lg font-bold leading-none">{eta}</p>
                            </div>
                        </div>
                        <div className="h-10 w-px bg-border mx-2" />
                        <div className="flex items-center gap-2">
                            <Ruler className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase">Remaining</p>
                                <p className="text-lg font-bold leading-none">{distanceRemaining}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 rounded-lg p-3 mb-4 border border-primary/10">
                        <div className="flex items-start gap-3">
                            <Navigation2 className="h-6 w-6 text-primary mt-0.5" />
                            <p className="font-semibold text-foreground/90">{nextInstruction}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full gap-2" onClick={onCallShipper}>
                            <Phone className="h-4 w-4" />
                            Call Shipper
                        </Button>
                        <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/20 hover:bg-destructive/10" onClick={onReportIssue}>
                            <AlertCircle className="h-4 w-4" />
                            Report Issue
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
