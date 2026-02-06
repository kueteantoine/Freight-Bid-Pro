'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    getSurgePricingRules,
    createSurgePricingRule,
    updateSurgePricingRule,
    deleteSurgePricingRule,
    type SurgePricingRule,
    type SurgeTriggerType,
} from '@/app/actions/surge-pricing-actions';

export default function SurgePricingManager() {
    const [rules, setRules] = useState<SurgePricingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<SurgePricingRule | null>(null);
    const [formData, setFormData] = useState<SurgePricingRule>({
        rule_name: '',
        trigger_type: 'demand',
        trigger_conditions: {},
        surge_multiplier: 1.5,
        max_multiplier: 3.0,
        priority: 0,
        is_active: true,
    });


    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setLoading(true);
        const result = await getSurgePricingRules();
        if (result.success && result.data) setRules(result.data);
        setLoading(false);
    };

    const handleOpenDialog = (rule?: SurgePricingRule) => {
        if (rule) {
            setEditingRule(rule);
            setFormData(rule);
        } else {
            setEditingRule(null);
            setFormData({
                rule_name: '',
                trigger_type: 'demand',
                trigger_conditions: {},
                surge_multiplier: 1.5,
                max_multiplier: 3.0,
                priority: 0,
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        const result = editingRule
            ? await updateSurgePricingRule(editingRule.id!, formData)
            : await createSurgePricingRule(formData);

        if (result.success) {
            toast({ title: 'Success', description: `Rule ${editingRule ? 'updated' : 'created'}` });
            setIsDialogOpen(false);
            loadRules();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this rule?')) return;
        const result = await deleteSurgePricingRule(id);
        if (result.success) {
            toast.success('Rule deleted');
            loadRules();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Surge Pricing Rules</h1>
                    <p className="text-gray-600 mt-1">Configure dynamic pricing multipliers</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {rules.map((rule) => (
                        <Card key={rule.id}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>{rule.rule_name}</CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {rule.trigger_type} • {rule.surge_multiplier}x multiplier • Priority: {rule.priority}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleOpenDialog(rule)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id!)}>
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
                        <DialogTitle>{editingRule ? 'Edit' : 'Add'} Surge Pricing Rule</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="rule_name">Rule Name *</Label>
                            <Input
                                id="rule_name"
                                value={formData.rule_name}
                                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="trigger_type">Trigger Type *</Label>
                            <Select
                                value={formData.trigger_type}
                                onValueChange={(value: SurgeTriggerType) =>
                                    setFormData({ ...formData, trigger_type: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="demand">Demand-based</SelectItem>
                                    <SelectItem value="time_of_day">Time of Day</SelectItem>
                                    <SelectItem value="date_range">Date Range</SelectItem>
                                    <SelectItem value="holiday">Holiday</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="surge_multiplier">Surge Multiplier *</Label>
                                <Input
                                    id="surge_multiplier"
                                    type="number"
                                    step="0.1"
                                    value={formData.surge_multiplier}
                                    onChange={(e) => setFormData({ ...formData, surge_multiplier: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="max_multiplier">Max Multiplier</Label>
                                <Input
                                    id="max_multiplier"
                                    type="number"
                                    step="0.1"
                                    value={formData.max_multiplier || ''}
                                    onChange={(e) => setFormData({ ...formData, max_multiplier: e.target.value ? parseFloat(e.target.value) : null })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Input
                                id="priority"
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
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
