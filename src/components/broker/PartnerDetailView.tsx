"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    Star,
    MapPin,
    Package,
    DollarSign,
    Calendar,
    MessageSquare,
    Save,
    Trash2,
} from "lucide-react";
import {
    updatePartnerRating,
    removeFromNetwork,
    getInteractionHistory,
    logInteraction,
    type BrokerInteraction,
} from "@/lib/services/broker-actions";
import { toast } from "sonner";

interface PartnerDetailViewProps {
    partner: any;
    onClose: () => void;
    onUpdate: () => void;
}

export function PartnerDetailView({ partner, onClose, onUpdate }: PartnerDetailViewProps) {
    const [notes, setNotes] = useState(partner.notes || "");
    const [rating, setRating] = useState(partner.reliability_rating || 0);
    const [interactions, setInteractions] = useState<BrokerInteraction[]>([]);
    const [loading, setLoading] = useState(false);
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [newInteraction, setNewInteraction] = useState({
        type: "call" as const,
        notes: "",
    });

    const isShipper = partner.type === "shipper";

    useEffect(() => {
        loadInteractionHistory();
    }, []);

    const loadInteractionHistory = async () => {
        const partnerId = isShipper ? partner.shipper_user_id : partner.carrier_user_id;
        const { data } = await getInteractionHistory(partnerId);
        if (data) setInteractions(data);
    };

    const handleSave = async () => {
        setLoading(true);
        const { error } = await updatePartnerRating(
            partner.id,
            partner.type,
            isShipper ? undefined : rating,
            notes
        );

        if (error) {
            toast.error("Failed to update partner: " + error);
        } else {
            toast.success("Partner updated successfully!");
            onUpdate();
        }
        setLoading(false);
    };

    const handleRemove = async () => {
        if (!confirm("Are you sure you want to remove this partner from your network?")) {
            return;
        }

        setLoading(true);
        const { error } = await removeFromNetwork(partner.id, partner.type);

        if (error) {
            toast.error("Failed to remove partner: " + error);
        } else {
            toast.success("Partner removed from network");
            onClose();
            onUpdate();
        }
        setLoading(false);
    };

    const handleLogInteraction = async () => {
        const partnerId = isShipper ? partner.shipper_user_id : partner.carrier_user_id;
        const { error } = await logInteraction(
            partnerId,
            partner.type,
            newInteraction.type,
            newInteraction.notes
        );

        if (error) {
            toast.error("Failed to log interaction: " + error);
        } else {
            toast.success("Interaction logged successfully!");
            setShowInteractionForm(false);
            setNewInteraction({ type: "call", notes: "" });
            loadInteractionHistory();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500";
            case "inactive":
                return "bg-gray-500";
            case "suspended":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onClose}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Network
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={loading}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                    </Button>
                    <Button variant="destructive" onClick={handleRemove} disabled={loading}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">
                                {isShipper
                                    ? partner.shipper_profile?.company_name
                                    : partner.carrier_profile?.company_name || "Unnamed Company"}
                            </CardTitle>
                            <p className="text-muted-foreground mt-1">
                                {isShipper ? partner.shipper_profile?.email : partner.carrier_profile?.email}
                            </p>
                        </div>
                        <Badge className={getStatusColor(partner.relationship_status)}>
                            {partner.relationship_status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Statistics */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                            <Package className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Shipments</p>
                                <p className="text-2xl font-bold">
                                    {isShipper ? partner.total_shipments_brokered : partner.total_shipments_assigned}
                                </p>
                            </div>
                        </div>

                        {isShipper && (
                            <>
                                <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                                    <DollarSign className="h-8 w-8 text-green-600" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Revenue</p>
                                        <p className="text-2xl font-bold">
                                            {partner.total_revenue_generated.toLocaleString()} XAF
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                                    <DollarSign className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Commission</p>
                                        <p className="text-2xl font-bold">{partner.commission_rate}%</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {!isShipper && (
                            <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                                <Star className="h-8 w-8 text-yellow-500" />
                                <div>
                                    <p className="text-sm text-muted-foreground">On-Time Rate</p>
                                    <p className="text-2xl font-bold">{partner.performance_metrics.on_time_rate}%</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rating (Carriers only) */}
                    {!isShipper && (
                        <div className="space-y-2">
                            <Label>Private Reliability Rating</Label>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-8 w-8 cursor-pointer transition-colors ${star <= rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                        onClick={() => setRating(star)}
                                    />
                                ))}
                                <span className="ml-2 text-sm text-muted-foreground">
                                    {rating > 0 ? `${rating.toFixed(1)} / 5.0` : "Not rated"}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Service Areas (Carriers only) */}
                    {!isShipper && partner.service_areas && partner.service_areas.length > 0 && (
                        <div className="space-y-2">
                            <Label>Service Areas</Label>
                            <div className="flex flex-wrap gap-2">
                                {partner.service_areas.map((area: string, index: number) => (
                                    <Badge key={index} variant="outline">
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {area}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Private Notes</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add private notes about this partner..."
                            rows={4}
                        />
                    </div>

                    {/* Contract Details (Shippers only) */}
                    {isShipper && partner.contract_details && Object.keys(partner.contract_details).length > 0 && (
                        <div className="space-y-2">
                            <Label>Contract Details</Label>
                            <div className="p-4 bg-accent/10 rounded-lg">
                                <pre className="text-sm">{JSON.stringify(partner.contract_details, null, 2)}</pre>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Interaction History */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Interaction History</CardTitle>
                        <Button
                            size="sm"
                            onClick={() => setShowInteractionForm(!showInteractionForm)}
                        >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Log Interaction
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {showInteractionForm && (
                        <div className="p-4 bg-accent/10 rounded-lg space-y-3">
                            <div className="space-y-2">
                                <Label>Interaction Type</Label>
                                <select
                                    className="w-full p-2 border rounded-md"
                                    value={newInteraction.type}
                                    onChange={(e) =>
                                        setNewInteraction({ ...newInteraction, type: e.target.value as any })
                                    }
                                >
                                    <option value="call">Call</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="email">Email</option>
                                    <option value="contract_signed">Contract Signed</option>
                                    <option value="issue_resolved">Issue Resolved</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={newInteraction.notes}
                                    onChange={(e) =>
                                        setNewInteraction({ ...newInteraction, notes: e.target.value })
                                    }
                                    placeholder="What was discussed or agreed upon?"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowInteractionForm(false)}
                                >
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleLogInteraction}>
                                    Save Interaction
                                </Button>
                            </div>
                        </div>
                    )}

                    {interactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No interactions logged yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {interactions.map((interaction) => (
                                <div
                                    key={interaction.id}
                                    className="p-4 border rounded-lg space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">
                                            {interaction.interaction_type.replace(/_/g, " ").toUpperCase()}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(interaction.interaction_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {interaction.notes && (
                                        <p className="text-sm">{interaction.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
