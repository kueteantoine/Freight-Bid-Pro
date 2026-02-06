"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, CheckCircle, AlertTriangle } from "lucide-react";
import {
    getUpcomingRenewals,
    markReminderSent,
    updateRenewalDate,
    type UpcomingRenewal,
} from "@/lib/services/contract-renewal-service";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RenewalRemindersWidget() {
    const [renewals, setRenewals] = useState<UpcomingRenewal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRenewal, setSelectedRenewal] = useState<UpcomingRenewal | null>(null);
    const [showRenewDialog, setShowRenewDialog] = useState(false);
    const [newRenewalDate, setNewRenewalDate] = useState("");

    useEffect(() => {
        loadRenewals();
    }, []);

    const loadRenewals = async () => {
        setLoading(true);
        const { data, error } = await getUpcomingRenewals(90);
        if (data) setRenewals(data);
        setLoading(false);
    };

    const handleMarkSent = async (partnerId: string) => {
        const { success, error } = await markReminderSent(partnerId);
        if (error) {
            toast.error("Failed to mark reminder: " + error);
        } else {
            toast.success("Reminder marked as sent");
            loadRenewals();
        }
    };

    const handleRenewContract = async () => {
        if (!selectedRenewal || !newRenewalDate) return;

        const { success, error } = await updateRenewalDate(
            selectedRenewal.id,
            newRenewalDate
        );

        if (error) {
            toast.error("Failed to update renewal date: " + error);
        } else {
            toast.success("Contract renewed successfully!");
            setShowRenewDialog(false);
            setSelectedRenewal(null);
            setNewRenewalDate("");
            loadRenewals();
        }
    };

    const getUrgencyColor = (days: number) => {
        if (days <= 7) return "bg-red-500";
        if (days <= 30) return "bg-orange-500";
        return "bg-yellow-500";
    };

    const getUrgencyText = (days: number) => {
        if (days <= 7) return "Urgent";
        if (days <= 30) return "Soon";
        return "Upcoming";
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Contract Renewals</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-4">Loading renewals...</p>
                </CardContent>
            </Card>
        );
    }

    if (renewals.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Contract Renewals</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
                        <p className="text-muted-foreground">No upcoming renewals in the next 90 days</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Contract Renewals ({renewals.length})</CardTitle>
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {renewals.slice(0, 5).map((renewal) => (
                            <div
                                key={renewal.id}
                                className="p-4 border rounded-lg space-y-2 hover:bg-accent/5 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold">{renewal.company_name}</h4>
                                            <Badge className={getUrgencyColor(renewal.days_until_renewal)}>
                                                {getUrgencyText(renewal.days_until_renewal)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{renewal.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Renewal Date:</span>
                                        <p className="font-medium">
                                            {new Date(renewal.renewal_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Days Until:</span>
                                        <p className="font-medium">{renewal.days_until_renewal} days</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Shipments:</span>
                                        <p className="font-medium">{renewal.total_shipments}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Revenue:</span>
                                        <p className="font-medium">{renewal.total_revenue.toLocaleString()} XAF</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    {!renewal.reminder_sent && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleMarkSent(renewal.id)}
                                        >
                                            <Mail className="mr-2 h-4 w-4" />
                                            Send Reminder
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedRenewal(renewal);
                                            setShowRenewDialog(true);
                                        }}
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Renew Contract
                                    </Button>
                                </div>

                                {renewal.reminder_sent && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Reminder sent</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        {renewals.length > 5 && (
                            <p className="text-sm text-muted-foreground text-center pt-2">
                                +{renewals.length - 5} more renewals
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Renew Contract Dialog */}
            <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renew Contract</DialogTitle>
                        <DialogDescription>
                            Update the renewal date for {selectedRenewal?.company_name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Renewal Date</Label>
                            <Input
                                type="text"
                                value={
                                    selectedRenewal
                                        ? new Date(selectedRenewal.renewal_date).toLocaleDateString()
                                        : ""
                                }
                                disabled
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>New Renewal Date</Label>
                            <Input
                                type="date"
                                value={newRenewalDate}
                                onChange={(e) => setNewRenewalDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowRenewDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleRenewContract} disabled={!newRenewalDate}>
                                Update Renewal Date
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
