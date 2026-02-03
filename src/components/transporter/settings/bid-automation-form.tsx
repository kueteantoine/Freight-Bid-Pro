"use client";

import { useState } from "react";
import { BidAutomationSettings } from "@/lib/types/database";
import { updateBidAutomationSettings } from "@/app/actions/carrier-settings-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Bot, TrendingUp, TrendingDown, Target } from "lucide-react";

interface BidAutomationFormProps {
    initialSettings: BidAutomationSettings | null;
}

export function BidAutomationForm({ initialSettings }: BidAutomationFormProps) {
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(initialSettings?.enabled || false);
    const [strategy, setStrategy] = useState(initialSettings?.strategy || "market");
    const [maxAmount, setMaxAmount] = useState(initialSettings?.max_auto_bid_amount?.toString() || "");
    const [minMargin, setMinMargin] = useState(initialSettings?.min_profit_margin?.toString() || "10");
    const [minRating, setMinRating] = useState(initialSettings?.min_shipper_rating?.toString() || "4.5");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await updateBidAutomationSettings({
                enabled,
                strategy,
                max_auto_bid_amount: maxAmount ? parseFloat(maxAmount) : null,
                min_profit_margin: minMargin ? parseFloat(minMargin) : null,
                min_shipper_rating: minRating ? parseFloat(minRating) : null,
            });
            toast.success("Automation settings updated");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Bid Automation</CardTitle>
                            <CardDescription>
                                Configure how our AI agent bids on your behalf.
                            </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch checked={enabled} onCheckedChange={setEnabled} id="auto-mode" />
                            <Label htmlFor="auto-mode" className="font-medium">
                                {enabled ? "Enabled" : "Disabled"}
                            </Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">

                    <div className={!enabled ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Bidding Strategy</Label>
                            <RadioGroup value={strategy} onValueChange={(value) => setStrategy(value as any)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <RadioGroupItem value="lowest" id="lowest" className="peer sr-only" />
                                    <Label
                                        htmlFor="lowest"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <TrendingDown className="mb-3 h-6 w-6" />
                                        <div className="font-semibold">Aggressive</div>
                                        <div className="text-xs text-center text-muted-foreground mt-1">
                                            Always aim for the lowest price to win volume.
                                        </div>
                                    </Label>
                                </div>

                                <div>
                                    <RadioGroupItem value="market" id="market" className="peer sr-only" />
                                    <Label
                                        htmlFor="market"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <Target className="mb-3 h-6 w-6" />
                                        <div className="font-semibold">Balanced</div>
                                        <div className="text-xs text-center text-muted-foreground mt-1">
                                            Bid close to market average with slight discount.
                                        </div>
                                    </Label>
                                </div>

                                <div>
                                    <RadioGroupItem value="premium" id="premium" className="peer sr-only" />
                                    <Label
                                        htmlFor="premium"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                    >
                                        <TrendingUp className="mb-3 h-6 w-6" />
                                        <div className="font-semibold">Premium</div>
                                        <div className="text-xs text-center text-muted-foreground mt-1">
                                            Maintain higher margins, focus on quality shippers.
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="space-y-2">
                                <Label htmlFor="maxAmount">Global Max Bid Amount (XAF)</Label>
                                <Input
                                    id="maxAmount"
                                    type="number"
                                    placeholder="e.g. 5000000"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Absolute limit for any single auto-bid.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minMargin">Minimum Profit Margin (%)</Label>
                                <Input
                                    id="minMargin"
                                    type="number"
                                    placeholder="e.g. 15"
                                    value={minMargin}
                                    onChange={(e) => setMinMargin(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">System won't bid if projected margin is lower.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="minRating">Minimum Shipper Rating</Label>
                                <Input
                                    id="minRating"
                                    type="number"
                                    step="0.1"
                                    max="5"
                                    placeholder="e.g. 4.0"
                                    value={minRating}
                                    onChange={(e) => setMinRating(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Only bid on loads from shippers with this rating or higher.</p>
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between items-center bg-slate-50 border-t p-6">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Bot className="mr-2 h-4 w-4" />
                        {enabled ? "AI Agent is active" : "AI Agent is sleeping"}
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Settings
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
