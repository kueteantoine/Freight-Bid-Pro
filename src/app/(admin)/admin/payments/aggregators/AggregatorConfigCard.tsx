"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, TestTube } from "lucide-react";
import { updatePaymentAggregatorConfig, testAggregatorConnection } from "@/app/actions/admin-payment-actions";
import { useToast } from "@/hooks/use-toast";

interface AggregatorConfigCardProps {
    aggregator: {
        id: string;
        aggregator_name: string;
        display_name: string;
        is_active: boolean;
        api_base_url: string | null;
        default_commission_percentage: number;
        default_aggregator_fee_percentage: number;
        default_mobile_money_fee_percentage: number;
        connection_status: string;
        last_connection_test: string | null;
        connection_error_message: string | null;
    };
}

export default function AggregatorConfigCard({ aggregator }: AggregatorConfigCardProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        is_active: aggregator.is_active,
        api_base_url: aggregator.api_base_url || "",
        default_commission_percentage: aggregator.default_commission_percentage,
        default_aggregator_fee_percentage: aggregator.default_aggregator_fee_percentage,
        default_mobile_money_fee_percentage: aggregator.default_mobile_money_fee_percentage
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePaymentAggregatorConfig(aggregator.id, formData);
            toast({
                title: "Configuration Updated",
                description: `${aggregator.display_name} settings have been saved.`
            });
            setIsEditing(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update configuration",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        try {
            const result = await testAggregatorConnection(aggregator.id);
            toast({
                title: result.success ? "Connection Successful" : "Connection Failed",
                description: result.success
                    ? "Successfully connected to payment aggregator"
                    : result.data.connection_error_message,
                variant: result.success ? "default" : "destructive"
            });
        } catch (error) {
            toast({
                title: "Test Failed",
                description: "Could not test connection",
                variant: "destructive"
            });
        } finally {
            setIsTesting(false);
        }
    };

    const getStatusBadge = () => {
        switch (aggregator.connection_status) {
            case "connected":
                return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Connected</Badge>;
            case "error":
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
            default:
                return <Badge variant="secondary">Not Configured</Badge>;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{aggregator.display_name}</CardTitle>
                        <CardDescription className="mt-1">
                            {aggregator.aggregator_name}
                        </CardDescription>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor={`active-${aggregator.id}`}>Active</Label>
                    <Switch
                        id={`active-${aggregator.id}`}
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        disabled={!isEditing}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`url-${aggregator.id}`}>API Base URL</Label>
                    <Input
                        id={`url-${aggregator.id}`}
                        value={formData.api_base_url}
                        onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                        placeholder="https://api.example.com"
                        disabled={!isEditing}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`commission-${aggregator.id}`}>Commission %</Label>
                        <Input
                            id={`commission-${aggregator.id}`}
                            type="number"
                            step="0.1"
                            value={formData.default_commission_percentage}
                            onChange={(e) => setFormData({ ...formData, default_commission_percentage: parseFloat(e.target.value) })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`agg-fee-${aggregator.id}`}>Agg. Fee %</Label>
                        <Input
                            id={`agg-fee-${aggregator.id}`}
                            type="number"
                            step="0.1"
                            value={formData.default_aggregator_fee_percentage}
                            onChange={(e) => setFormData({ ...formData, default_aggregator_fee_percentage: parseFloat(e.target.value) })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={`momo-fee-${aggregator.id}`}>MoMo Fee %</Label>
                        <Input
                            id={`momo-fee-${aggregator.id}`}
                            type="number"
                            step="0.1"
                            value={formData.default_mobile_money_fee_percentage}
                            onChange={(e) => setFormData({ ...formData, default_mobile_money_fee_percentage: parseFloat(e.target.value) })}
                            disabled={!isEditing}
                        />
                    </div>
                </div>

                {aggregator.connection_error_message && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {aggregator.connection_error_message}
                    </div>
                )}

                {aggregator.last_connection_test && (
                    <p className="text-xs text-muted-foreground">
                        Last tested: {new Date(aggregator.last_connection_test).toLocaleString()}
                    </p>
                )}

                <div className="flex gap-2 pt-2">
                    {isEditing ? (
                        <>
                            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button onClick={() => setIsEditing(true)} className="flex-1">
                                Edit Configuration
                            </Button>
                            <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
