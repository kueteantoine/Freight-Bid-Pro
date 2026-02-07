'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    getAdApprovalQueue,
    approveAdvertisement,
    rejectAdvertisement,
} from '@/lib/services/admin/advertisements';
import { Check, X, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdApprovalQueue() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchQueue();
    }, []);

    async function fetchQueue() {
        setLoading(true);
        const result = await getAdApprovalQueue();
        if (result.success) {
            setAds(result.data || []);
        }
        setLoading(false);
    }

    async function handleApprove() {
        if (!selectedAd) return;

        setSubmitting(true);
        const result = await approveAdvertisement(selectedAd.id, notes);

        if (result.success) {
            toast({
                title: 'Advertisement Approved',
                description: 'The advertisement has been approved and is now active.',
            });
            setSelectedAd(null);
            setNotes('');
            fetchQueue();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to approve advertisement',
                variant: 'destructive',
            });
        }
        setSubmitting(false);
    }

    async function handleReject() {
        if (!selectedAd || !notes.trim()) {
            toast({
                title: 'Rejection Reason Required',
                description: 'Please provide a reason for rejecting this advertisement.',
                variant: 'destructive',
            });
            return;
        }

        setSubmitting(true);
        const result = await rejectAdvertisement(selectedAd.id, notes);

        if (result.success) {
            toast({
                title: 'Advertisement Rejected',
                description: 'The advertisement has been rejected.',
            });
            setSelectedAd(null);
            setNotes('');
            fetchQueue();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to reject advertisement',
                variant: 'destructive',
            });
        }
        setSubmitting(false);
    }

    if (loading) {
        return <div>Loading approval queue...</div>;
    }

    if (ads.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Approval Queue</CardTitle>
                    <CardDescription>No advertisements pending approval</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {ads.map((ad) => (
                    <Card key={ad.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle>{ad.ad_title}</CardTitle>
                                    <CardDescription>
                                        Submitted by: {ad.advertiser_email || 'Unknown'} •{' '}
                                        {new Date(ad.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <Badge>{ad.ad_placement_zone?.replace('_', ' ')}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium">Ad Type</p>
                                    <p className="text-sm text-muted-foreground">{ad.ad_type}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Pricing</p>
                                    <p className="text-sm text-muted-foreground">
                                        {ad.pricing_model}: {ad.price_amount?.toLocaleString()} XAF
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Duration</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(ad.start_date).toLocaleDateString()} -{' '}
                                        {new Date(ad.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Advertiser Type</p>
                                    <p className="text-sm text-muted-foreground">
                                        {ad.advertiser_type?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>

                            {ad.ad_content && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Content</p>
                                    <div className="rounded-md border p-4 text-sm">{ad.ad_content}</div>
                                </div>
                            )}

                            {ad.ad_image_url && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Image</p>
                                    <img
                                        src={ad.ad_image_url}
                                        alt={ad.ad_title}
                                        className="rounded-md max-h-48 object-cover"
                                    />
                                </div>
                            )}

                            {ad.target_url && (
                                <div>
                                    <p className="text-sm font-medium mb-2">Target URL</p>
                                    <a
                                        href={ad.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {ad.target_url}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button
                                    onClick={() => {
                                        setSelectedAd(ad);
                                        setActionType('approve');
                                    }}
                                    className="flex-1"
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setSelectedAd(ad);
                                        setActionType('reject');
                                    }}
                                    className="flex-1"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog
                open={!!selectedAd}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedAd(null);
                        setActionType(null);
                        setNotes('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve' ? 'Approve Advertisement' : 'Reject Advertisement'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? 'Add optional notes about this approval.'
                                : 'Please provide a reason for rejecting this advertisement.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder={
                                actionType === 'approve'
                                    ? 'Optional approval notes...'
                                    : 'Rejection reason (required)...'
                            }
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedAd(null);
                                setActionType(null);
                                setNotes('');
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={actionType === 'approve' ? handleApprove : handleReject}
                            disabled={submitting}
                            variant={actionType === 'reject' ? 'destructive' : 'default'}
                        >
                            {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
