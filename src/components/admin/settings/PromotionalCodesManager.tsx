'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
    getPromotionalCodes,
    createPromotionalCode,
    updatePromotionalCode,
    deletePromotionalCode,
    getCodeRedemptionStats,
    type PromotionalCode,
} from '@/app/actions/promotional-codes-actions';

export default function PromotionalCodesManager() {
    const [codes, setCodes] = useState<PromotionalCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<PromotionalCode | null>(null);
    const [formData, setFormData] = useState<PromotionalCode>({
        code: '',
        discount_percentage: 0,
        valid_from: '',
        valid_until: '',
        max_usage_count: null,
        max_usage_per_user: 1,
        is_active: true,
    });


    useEffect(() => {
        loadCodes();
    }, []);

    const loadCodes = async () => {
        setLoading(true);
        const result = await getPromotionalCodes();
        if (result.success && result.data) {
            setCodes(result.data);
        }
        setLoading(false);
    };

    const handleOpenDialog = (code?: PromotionalCode) => {
        if (code) {
            setEditingCode(code);
            setFormData(code);
        } else {
            setEditingCode(null);
            const now = new Date();
            const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
            setFormData({
                code: '',
                discount_percentage: 10,
                valid_from: new Date().toISOString().split('T')[0],
                valid_until: nextMonth.toISOString().split('T')[0],
                max_usage_count: null,
                max_usage_per_user: 1,
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        const result = editingCode
            ? await updatePromotionalCode(editingCode.id!, formData)
            : await createPromotionalCode(formData);

        if (result.success) {
            toast.success(`Code ${editingCode ? 'updated' : 'created'}`);
            setIsDialogOpen(false);
            loadCodes();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this code?')) return;
        const result = await deletePromotionalCode(id);
        if (result.success) {
            toast.success('Code deleted');
            loadCodes();
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Code copied to clipboard');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Promotional Codes</h1>
                    <p className="text-gray-600 mt-1">Manage discount codes and promotions</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Code
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {codes.map((code) => {
                        const isExpired = new Date(code.valid_until) < new Date();
                        const isActive = code.is_active && !isExpired;
                        return (
                            <Card key={code.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CardTitle className="font-mono text-lg">{code.code}</CardTitle>
                                                <Button size="sm" variant="ghost" onClick={() => copyCode(code.code)}>
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                {isActive ? (
                                                    <Badge variant="default">Active</Badge>
                                                ) : isExpired ? (
                                                    <Badge variant="secondary">Expired</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {code.discount_percentage}% off • Valid: {new Date(code.valid_from).toLocaleDateString()} - {new Date(code.valid_until).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Used: {code.current_usage_count || 0} {code.max_usage_count ? `/ ${code.max_usage_count}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleOpenDialog(code)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDelete(code.id!)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCode ? 'Edit' : 'Create'} Promotional Code</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="SUMMER2024"
                            />
                        </div>
                        <div>
                            <Label htmlFor="discount_percentage">Discount Percentage *</Label>
                            <Input
                                id="discount_percentage"
                                type="number"
                                step="0.01"
                                value={formData.discount_percentage}
                                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="valid_from">Valid From *</Label>
                                <Input
                                    id="valid_from"
                                    type="date"
                                    value={formData.valid_from.split('T')[0]}
                                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="valid_until">Valid Until *</Label>
                                <Input
                                    id="valid_until"
                                    type="date"
                                    value={formData.valid_until.split('T')[0]}
                                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="max_usage_count">Max Total Uses</Label>
                                <Input
                                    id="max_usage_count"
                                    type="number"
                                    value={formData.max_usage_count || ''}
                                    onChange={(e) => setFormData({ ...formData, max_usage_count: e.target.value ? parseInt(e.target.value) : null })}
                                    placeholder="Unlimited"
                                />
                            </div>
                            <div>
                                <Label htmlFor="max_usage_per_user">Max Uses Per User</Label>
                                <Input
                                    id="max_usage_per_user"
                                    type="number"
                                    value={formData.max_usage_per_user}
                                    onChange={(e) => setFormData({ ...formData, max_usage_per_user: parseInt(e.target.value) })}
                                />
                            </div>
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
