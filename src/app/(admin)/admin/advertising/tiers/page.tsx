'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TierEditorDialog } from './_components/tier-editor-dialog';
import {
    getAllTiers,
    deleteTier,
    toggleTierStatus,
    getSubscriptionAnalytics,
} from '@/app/actions/admin-tier-actions';

export default function AdminTiersPage() {
    const [tiers, setTiers] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editorOpen, setEditorOpen] = useState(false);
    const [selectedTier, setSelectedTier] = useState<any>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [tiersResult, analyticsResult] = await Promise.all([
            getAllTiers(),
            getSubscriptionAnalytics(),
        ]);

        if (tiersResult.success) {
            setTiers(tiersResult.data || []);
        }

        if (analyticsResult.success) {
            setAnalytics(analyticsResult.data);
        }

        setLoading(false);
    }

    async function handleToggleStatus(tierId: string, currentStatus: boolean) {
        const result = await toggleTierStatus(tierId, !currentStatus);
        if (result.success) {
            toast({
                title: currentStatus ? 'Tier Deactivated' : 'Tier Activated',
            });
            await loadData();
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
    }

    async function handleDelete(tierId: string) {
        if (!confirm('Are you sure you want to delete this tier?')) return;

        const result = await deleteTier(tierId);
        if (result.success) {
            toast({ title: 'Tier deleted' });
            await loadData();
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
    }

    function handleEdit(tier: any) {
        setSelectedTier(tier);
        setEditorOpen(true);
    }

    function handleCreate() {
        setSelectedTier(null);
        setEditorOpen(true);
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Subscription Tiers</h1>
                    <p className="text-muted-foreground">
                        Configure pricing and features for advertisement subscriptions
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Tier
                </Button>
            </div>

            {analytics && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Subscribers</CardDescription>
                            <CardTitle className="text-3xl">
                                {analytics.total_subscribers}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Monthly Recurring Revenue</CardDescription>
                            <CardTitle className="text-3xl">
                                {analytics.total_mrr?.toLocaleString()} XAF
                            </CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Active Tiers</CardDescription>
                            <CardTitle className="text-3xl">
                                {tiers.filter((t) => t.is_active).length}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Manage Tiers</CardTitle>
                    <CardDescription>
                        Create, edit, and configure subscription tier pricing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tier</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Multiplier</TableHead>
                                    <TableHead>Subscribers</TableHead>
                                    <TableHead>Revenue</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tiers.map((tier) => {
                                    const tierAnalytics = analytics?.tiers?.find(
                                        (t: any) => t.tier_id === tier.id
                                    );

                                    return (
                                        <TableRow key={tier.id}>
                                            <TableCell className="font-medium">
                                                {tier.tier_name}
                                            </TableCell>
                                            <TableCell>
                                                {tier.monthly_price.toLocaleString()} {tier.currency}
                                            </TableCell>
                                            <TableCell>{tier.visibility_multiplier}x</TableCell>
                                            <TableCell>
                                                {tierAnalytics?.subscriber_count || 0}
                                            </TableCell>
                                            <TableCell>
                                                {tierAnalytics?.monthly_revenue?.toLocaleString() ||
                                                    0}{' '}
                                                {tier.currency}
                                            </TableCell>
                                            <TableCell>
                                                {tier.is_active ? (
                                                    <Badge variant="default">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(tier)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleToggleStatus(tier.id, tier.is_active)
                                                        }
                                                    >
                                                        {tier.is_active ? (
                                                            <ToggleRight className="h-4 w-4" />
                                                        ) : (
                                                            <ToggleLeft className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(tier.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <TierEditorDialog
                tier={selectedTier}
                open={editorOpen}
                onOpenChange={setEditorOpen}
                onSuccess={loadData}
            />
        </div>
    );
}
