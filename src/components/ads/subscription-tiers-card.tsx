'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getSubscriptionTiers,
    getActiveSubscription,
    createSubscription,
    type SubscriptionTier,
} from '@/app/actions/ad-subscription-actions';

interface SubscriptionTiersCardProps {
    onSubscribe?: () => void;
}

export function SubscriptionTiersCard({ onSubscribe }: SubscriptionTiersCardProps) {
    const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
    const [activeSubscription, setActiveSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [tiersResult, subscriptionResult] = await Promise.all([
            getSubscriptionTiers(),
            getActiveSubscription(),
        ]);

        if (tiersResult.success) {
            setTiers(tiersResult.data || []);
        }

        if (subscriptionResult.success && subscriptionResult.data) {
            setActiveSubscription(subscriptionResult.data);
        }

        setLoading(false);
    }

    async function handleSubscribe(tierId: string) {
        setSubscribing(tierId);

        try {
            // TODO: Integrate with payment flow
            // For now, create subscription directly (will need payment integration)
            const result = await createSubscription(tierId, 'pending_payment');

            if (result.success) {
                toast({
                    title: 'Subscription Created',
                    description: 'Your subscription has been activated!',
                });
                await loadData();
                onSubscribe?.();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to create subscription',
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
            setSubscribing(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activeSubscription?.tier_name && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Current Subscription
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{activeSubscription.tier_name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {activeSubscription.visibility_multiplier}x visibility boost
                                </p>
                            </div>
                            <Badge variant="default" className="text-sm">
                                Active
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {tiers.map((tier) => {
                    const isActive = activeSubscription?.tier_id === tier.id;
                    const features = tier.features;

                    return (
                        <Card
                            key={tier.id}
                            className={`relative ${isActive ? 'border-primary/50 bg-primary/5' : ''
                                }`}
                        >
                            {tier.tier_slug === 'gold' && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600">
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="text-2xl">{tier.tier_name}</CardTitle>
                                <CardDescription>{tier.tier_description}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div>
                                    <p className="text-4xl font-bold">
                                        {tier.monthly_price.toLocaleString()}
                                        <span className="text-lg font-normal text-muted-foreground ml-1">
                                            {tier.currency}
                                        </span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">per month</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">
                                            {tier.visibility_multiplier}x visibility boost
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm capitalize">
                                            {features.analytics_level} analytics
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm capitalize">
                                            {features.placement_priority.replace('_', ' ')} placement
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm capitalize">
                                            {features.support_tier} support
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">
                                            Up to {features.max_active_ads} active ads
                                        </span>
                                    </div>

                                    {features.api_access && (
                                        <div className="flex items-center gap-2">
                                            <Check className="h-4 w-4 text-primary" />
                                            <span className="text-sm">API access</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>

                            <CardFooter>
                                {isActive ? (
                                    <Button className="w-full" variant="outline" disabled>
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full"
                                        onClick={() => handleSubscribe(tier.id)}
                                        disabled={subscribing !== null || !!activeSubscription}
                                    >
                                        {subscribing === tier.id ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Subscribing...
                                            </>
                                        ) : (
                                            'Subscribe'
                                        )}
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {activeSubscription && (
                <p className="text-sm text-muted-foreground text-center">
                    To change your subscription tier, please cancel your current subscription first.
                </p>
            )}
        </div>
    );
}
