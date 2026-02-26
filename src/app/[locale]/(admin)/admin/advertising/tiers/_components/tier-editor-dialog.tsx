'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createTier, updateTier, type CreateTierInput } from '@/app/actions/admin-tier-actions';

interface TierEditorDialogProps {
    tier?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function TierEditorDialog({ tier, open, onOpenChange, onSuccess }: TierEditorDialogProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState<CreateTierInput>(
        tier || {
            tier_name: '',
            tier_slug: '',
            tier_description: '',
            monthly_price: 0,
            currency: 'XAF',
            visibility_multiplier: 2,
            features: {
                analytics_level: 'basic',
                placement_priority: 'profile',
                support_tier: 'email',
                max_active_ads: 3,
                api_access: false,
            },
            is_active: true,
            display_order: 0,
        }
    );

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = tier
                ? await updateTier(tier.id, formData)
                : await createTier(formData);

            if (result.success) {
                toast({
                    title: tier ? 'Tier Updated' : 'Tier Created',
                    description: `Subscription tier has been ${tier ? 'updated' : 'created'} successfully.`,
                });
                onOpenChange(false);
                onSuccess();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to save tier',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{tier ? 'Edit' : 'Create'} Subscription Tier</DialogTitle>
                        <DialogDescription>
                            Configure pricing and features for this subscription tier.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tier_name">Tier Name *</Label>
                                <Input
                                    id="tier_name"
                                    placeholder="Bronze"
                                    required
                                    value={formData.tier_name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tier_name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tier_slug">Tier Slug *</Label>
                                <Input
                                    id="tier_slug"
                                    placeholder="bronze"
                                    required
                                    value={formData.tier_slug}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            tier_slug: e.target.value.toLowerCase(),
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tier_description">Description</Label>
                            <Textarea
                                id="tier_description"
                                placeholder="Featured profile badge with 2x visibility boost"
                                value={formData.tier_description}
                                onChange={(e) =>
                                    setFormData({ ...formData, tier_description: e.target.value })
                                }
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="monthly_price">Monthly Price *</Label>
                                <Input
                                    id="monthly_price"
                                    type="number"
                                    placeholder="25000"
                                    required
                                    value={formData.monthly_price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            monthly_price: parseFloat(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency</Label>
                                <Input
                                    id="currency"
                                    placeholder="XAF"
                                    value={formData.currency}
                                    onChange={(e) =>
                                        setFormData({ ...formData, currency: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Visibility Multiplier: {formData.visibility_multiplier}x</Label>
                            <Slider
                                value={[formData.visibility_multiplier]}
                                onValueChange={([val]) =>
                                    setFormData({ ...formData, visibility_multiplier: val })
                                }
                                min={1}
                                max={20}
                                step={1}
                                className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                                How much more visible than free listings
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label>Features</Label>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="analytics_level" className="text-sm">
                                        Analytics Level
                                    </Label>
                                    <select
                                        id="analytics_level"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        value={formData.features.analytics_level}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                features: {
                                                    ...formData.features,
                                                    analytics_level: e.target.value as any,
                                                },
                                            })
                                        }
                                    >
                                        <option value="basic">Basic</option>
                                        <option value="detailed">Detailed</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="placement_priority" className="text-sm">
                                        Placement Priority
                                    </Label>
                                    <select
                                        id="placement_priority"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        value={formData.features.placement_priority}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                features: {
                                                    ...formData.features,
                                                    placement_priority: e.target.value as any,
                                                },
                                            })
                                        }
                                    >
                                        <option value="profile">Profile Only</option>
                                        <option value="top_3">Top 3 Results</option>
                                        <option value="homepage">Homepage Feature</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="support_tier" className="text-sm">
                                        Support Tier
                                    </Label>
                                    <select
                                        id="support_tier"
                                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                                        value={formData.features.support_tier}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                features: {
                                                    ...formData.features,
                                                    support_tier: e.target.value as any,
                                                },
                                            })
                                        }
                                    >
                                        <option value="email">Email Support</option>
                                        <option value="priority">Priority Support</option>
                                        <option value="dedicated">Dedicated Support</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_active_ads" className="text-sm">
                                        Max Active Ads
                                    </Label>
                                    <Input
                                        id="max_active_ads"
                                        type="number"
                                        value={formData.features.max_active_ads}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                features: {
                                                    ...formData.features,
                                                    max_active_ads: parseInt(e.target.value),
                                                },
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="api_access" className="text-sm">
                                    API Access
                                </Label>
                                <Switch
                                    id="api_access"
                                    checked={formData.features.api_access}
                                    onCheckedChange={(checked) =>
                                        setFormData({
                                            ...formData,
                                            features: { ...formData.features, api_access: checked },
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <Label htmlFor="is_active">Active</Label>
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_active: checked })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                type="number"
                                placeholder="0"
                                value={formData.display_order}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        display_order: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Tier'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
