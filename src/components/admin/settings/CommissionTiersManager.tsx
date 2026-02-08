'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    getCommissionTiers,
    createCommissionTier,
    updateCommissionTier,
    deleteCommissionTier,
    type CommissionTier,
} from '@/app/actions/commission-tiers-actions';

export default function CommissionTiersManager() {
    const [tiers, setTiers] = useState<CommissionTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTier, setEditingTier] = useState<CommissionTier | null>(null);
    const [formData, setFormData] = useState<CommissionTier>({
        tier_name: '',
        min_shipments_per_month: 0,
        max_shipments_per_month: null,
        commission_percentage: 0,
        is_active: true,
    });


    useEffect(() => {
        loadTiers();
    }, []);

    const loadTiers = async () => {
        setLoading(true);
        const result = await getCommissionTiers();
        if (result.success && result.data) {
            setTiers(result.data);
        }
        setLoading(false);
    };

    const handleOpenDialog = (tier?: CommissionTier) => {
        if (tier) {
            setEditingTier(tier);
            setFormData(tier);
        } else {
            setEditingTier(null);
            setFormData({
                tier_name: '',
                min_shipments_per_month: 0,
                max_shipments_per_month: null,
                commission_percentage: 0,
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        const result = editingTier
            ? await updateCommissionTier(editingTier.id!, formData)
            : await createCommissionTier(formData);

        if (result.success) {
            toast.success(`Tier ${editingTier ? 'updated' : 'created'}`);
            setIsDialogOpen(false);
            loadTiers();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this tier?')) return;
        const result = await deleteCommissionTier(id);
        if (result.success) {
            toast.success('Tier deleted');
            loadTiers();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Commission Tiers</h1>
                    <p className="text-gray-600 mt-1">Configure tiered commission structure</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tier
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {tiers.map((tier) => (
                        <Card key={tier.id}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>{tier.tier_name}</CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {tier.min_shipments_per_month} - {tier.max_shipments_per_month || '∞'} shipments/month
                                            → {tier.commission_percentage}% commission
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(tier)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(tier.id!)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTier ? 'Edit' : 'Add'} Commission Tier</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="tier_name">Tier Name *</Label>
                            <Input
                                id="tier_name"
                                value={formData.tier_name}
                                onChange={(e) => setFormData({ ...formData, tier_name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="min_shipments">Min Shipments/Month *</Label>
                                <Input
                                    id="min_shipments"
                                    type="number"
                                    value={formData.min_shipments_per_month}
                                    onChange={(e) => setFormData({ ...formData, min_shipments_per_month: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="max_shipments">Max Shipments/Month</Label>
                                <Input
                                    id="max_shipments"
                                    type="number"
                                    value={formData.max_shipments_per_month || ''}
                                    onChange={(e) => setFormData({ ...formData, max_shipments_per_month: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="commission_percentage">Commission Percentage *</Label>
                            <Input
                                id="commission_percentage"
                                type="number"
                                step="0.01"
                                value={formData.commission_percentage}
                                onChange={(e) => setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
