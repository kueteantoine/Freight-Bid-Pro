"use client";

import { useState } from "react";
import { PricingRule } from "@/lib/types/database";
import { upsertPricingRule, deletePricingRule } from "@/app/actions/carrier-settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit } from "lucide-react";

interface PricingRulesTableProps {
    initialRules: PricingRule[];
}

export function PricingRulesTable({ initialRules }: PricingRulesTableProps) {
    const [rules, setRules] = useState<PricingRule[]>(initialRules);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<PricingRule> | null>(null);
    const [loading, setLoading] = useState(false);

    const handleOpenDialog = (rule?: PricingRule) => {
        if (rule) {
            setEditingRule(rule);
        } else {
            setEditingRule({
                rule_name: "",
                freight_type: "General Cargo",
                base_rate: 0,
                rate_unit: "per_km",
                min_price: 0,
                is_active: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSaveRule = async () => {
        if (!editingRule?.rule_name || editingRule.base_rate === undefined) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const savedRule = await upsertPricingRule(editingRule);

            setRules(prev => {
                const index = prev.findIndex(r => r.id === savedRule.id);
                if (index >= 0) {
                    const newRules = [...prev];
                    newRules[index] = savedRule;
                    return newRules;
                } else {
                    return [savedRule, ...prev];
                }
            });

            toast.success("Pricing rule saved");
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save pricing rule");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        try {
            await deletePricingRule(id);
            setRules(prev => prev.filter(r => r.id !== id));
            toast.success("Rule deleted");
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete rule");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Pricing Rules</h2>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Rule
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rule Name</TableHead>
                            <TableHead>Freight Type</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Min Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No pricing rules defined. Add one to automate your bidding.
                                </TableCell>
                            </TableRow>
                        ) : (
                            rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                                    <TableCell>{rule.freight_type || "Any"}</TableCell>
                                    <TableCell>{rule.base_rate.toLocaleString()} XAF</TableCell>
                                    <TableCell className="capitalize">{rule.rate_unit.replace('_', ' ')}</TableCell>
                                    <TableCell>{rule.min_price?.toLocaleString() || 0} XAF</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(rule)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)} className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRule?.id ? "Edit Pricing Rule" : "New Pricing Rule"}</DialogTitle>
                        <DialogDescription>
                            Define base rates for automatic bid calculations.
                        </DialogDescription>
                    </DialogHeader>

                    {editingRule && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input
                                    id="name"
                                    value={editingRule.rule_name}
                                    onChange={e => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type</Label>
                                <Select
                                    value={editingRule.freight_type || "General Cargo"}
                                    onValueChange={v => setEditingRule({ ...editingRule, freight_type: v })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select freight type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General Cargo">General Cargo</SelectItem>
                                        <SelectItem value="Perishable Goods">Perishable Goods</SelectItem>
                                        <SelectItem value="Hazardous Materials">Hazardous Materials</SelectItem>
                                        <SelectItem value="Vehicles">Vehicles</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="rate" className="text-right">Base Rate</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    value={editingRule.base_rate}
                                    onChange={e => setEditingRule({ ...editingRule, base_rate: parseFloat(e.target.value) })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="unit" className="text-right">Unit</Label>
                                <Select
                                    value={editingRule.rate_unit}
                                    onValueChange={v => setEditingRule({ ...editingRule, rate_unit: v as any })}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="per_km">Per Km</SelectItem>
                                        <SelectItem value="per_kg">Per Kg</SelectItem>
                                        <SelectItem value="flat">Flat Rate</SelectItem>
                                        <SelectItem value="per_hour">Per Hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="min" className="text-right">Min Price</Label>
                                <Input
                                    id="min"
                                    type="number"
                                    value={editingRule.min_price || 0}
                                    onChange={e => setEditingRule({ ...editingRule, min_price: parseFloat(e.target.value) })}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveRule} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
