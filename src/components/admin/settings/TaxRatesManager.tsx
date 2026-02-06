'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
    getTaxRates,
    createTaxRate,
    updateTaxRate,
    deleteTaxRate,
    type TaxRate,
    type TaxCalculationMethod,
} from '@/app/actions/tax-rates-actions';

export default function TaxRatesManager() {
    const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<TaxRate | null>(null);
    const [formData, setFormData] = useState<TaxRate>({
        region_name: '',
        country: '',
        state_province: '',
        tax_name: '',
        tax_rate: 0,
        calculation_method: 'percentage',
        is_active: true,
    });
    const { toast } = useToast();

    useEffect(() => {
        loadTaxRates();
    }, []);

    const loadTaxRates = async () => {
        setLoading(true);
        const result = await getTaxRates();
        if (result.success && result.data) setTaxRates(result.data);
        setLoading(false);
    };

    const handleOpenDialog = (rate?: TaxRate) => {
        if (rate) {
            setEditingRate(rate);
            setFormData(rate);
        } else {
            setEditingRate(null);
            setFormData({
                region_name: '',
                country: '',
                state_province: '',
                tax_name: '',
                tax_rate: 0,
                calculation_method: 'percentage',
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        const result = editingRate
            ? await updateTaxRate(editingRate.id!, formData)
            : await createTaxRate(formData);

        if (result.success) {
            toast({ title: 'Success', description: `Tax rate ${editingRate ? 'updated' : 'created'}` });
            setIsDialogOpen(false);
            loadTaxRates();
        } else {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this tax rate?')) return;
        const result = await deleteTaxRate(id);
        if (result.success) {
            toast({ title: 'Success', description: 'Tax rate deleted' });
            loadTaxRates();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Tax Rates</h1>
                    <p className="text-gray-600 mt-1">Configure regional tax rates</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tax Rate
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {taxRates.map((rate) => (
                        <Card key={rate.id}>
                            <CardHeader>
                                <CardTitle>{rate.tax_name}</CardTitle>
                                <p className="text-sm text-gray-600">
                                    {rate.region_name} ({rate.country})
                                </p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-lg font-semibold mb-4">
                                    {rate.calculation_method === 'percentage' ? `${rate.tax_rate}%` : `$${rate.fixed_amount}`}
                                </p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(rate)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(rate.id!)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRate ? 'Edit' : 'Add'} Tax Rate</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="tax_name">Tax Name *</Label>
                            <Input
                                id="tax_name"
                                value={formData.tax_name}
                                onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                                placeholder="e.g., VAT, Sales Tax"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="country">Country *</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="region_name">Region Name *</Label>
                                <Input
                                    id="region_name"
                                    value={formData.region_name}
                                    onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="state_province">State/Province</Label>
                            <Input
                                id="state_province"
                                value={formData.state_province || ''}
                                onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="calculation_method">Calculation Method *</Label>
                            <Select
                                value={formData.calculation_method}
                                onValueChange={(value: TaxCalculationMethod) =>
                                    setFormData({ ...formData, calculation_method: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Percentage</SelectItem>
                                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                                    <SelectItem value="tiered">Tiered</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.calculation_method === 'percentage' ? (
                            <div>
                                <Label htmlFor="tax_rate">Tax Rate (%) *</Label>
                                <Input
                                    id="tax_rate"
                                    type="number"
                                    step="0.01"
                                    value={formData.tax_rate || ''}
                                    onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                                />
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="fixed_amount">Fixed Amount *</Label>
                                <Input
                                    id="fixed_amount"
                                    type="number"
                                    step="0.01"
                                    value={formData.fixed_amount || ''}
                                    onChange={(e) => setFormData({ ...formData, fixed_amount: parseFloat(e.target.value) })}
                                />
                            </div>
                        )}
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
