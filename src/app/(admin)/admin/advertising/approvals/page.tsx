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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    getPendingAdvertisements,
    approveUserAdvertisement,
    rejectUserAdvertisement,
} from '@/app/actions/user-ad-actions';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

export default function AdminAdApprovalsPage() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadAds();
    }, []);

    async function loadAds() {
        setLoading(true);
        const result = await getPendingAdvertisements();
        if (result.success) {
            setAds(result.data || []);
        }
        setLoading(false);
    }

    async function handleApprove(adId: string) {
        setActionLoading(adId);
        const result = await approveUserAdvertisement(adId);
        if (result.success) {
            toast({ title: 'Advertisement approved' });
            await loadAds();
            setViewDialogOpen(false);
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
        setActionLoading(null);
    }

    async function handleReject() {
        if (!rejectionReason) {
            toast({ title: 'Please provide a reason for rejection', variant: 'destructive' });
            return;
        }

        setActionLoading(selectedAd.id);
        const result = await rejectUserAdvertisement(selectedAd.id, rejectionReason);
        if (result.success) {
            toast({ title: 'Advertisement rejected' });
            await loadAds();
            setRejectDialogOpen(false);
            setViewDialogOpen(false);
            setRejectionReason('');
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
        setActionLoading(null);
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Ad Approvals</h1>
                <p className="text-muted-foreground">
                    Review and approve advertisements submitted by users
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Review</CardTitle>
                    <CardDescription>
                        Advertisements waiting for administrator approval
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No advertisements pending approval.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad Title</TableHead>
                                    <TableHead>Advertiser</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Zone</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ads.map((ad) => (
                                    <TableRow key={ad.id}>
                                        <TableCell className="font-medium">{ad.ad_title}</TableCell>
                                        <TableCell>{ad.user_profiles?.full_name || 'N/A'}</TableCell>
                                        <TableCell className="capitalize">{ad.ad_type}</TableCell>
                                        <TableCell className="capitalize">
                                            {ad.ad_placement_zone.replace('_', ' ')}
                                        </TableCell>
                                        <TableCell>
                                            {formatDistanceToNow(new Date(ad.created_at), {
                                                addSuffix: true,
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedAd(ad);
                                                    setViewDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Review Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    {selectedAd && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Review Advertisement</DialogTitle>
                                <DialogDescription>
                                    Check the ad content before approving
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Title</Label>
                                        <p className="font-medium text-sm">{selectedAd.ad_title}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Advertiser</Label>
                                        <p className="font-medium text-sm">
                                            {selectedAd.user_profiles?.full_name}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Type</Label>
                                        <p className="capitalize text-sm">{selectedAd.ad_type}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Placement Zone</Label>
                                        <p className="capitalize text-sm">
                                            {selectedAd.ad_placement_zone.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Target URL</Label>
                                    <a
                                        href={selectedAd.target_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-sm flex items-center gap-1"
                                    >
                                        {selectedAd.target_url} <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Ad Creative</Label>
                                    {selectedAd.ad_image_url ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                                            <Image
                                                src={selectedAd.ad_image_url}
                                                alt={selectedAd.ad_title}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-32 rounded-lg border flex items-center justify-center bg-muted text-muted-foreground italic text-sm">
                                            No image provided
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Content/Description</Label>
                                    <p className="text-sm bg-muted p-3 rounded-md border whitespace-pre-wrap italic">
                                        {selectedAd.ad_content}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Start Date</Label>
                                        <p className="text-sm">
                                            {new Date(selectedAd.start_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">End Date</Label>
                                        <p className="text-sm">
                                            {new Date(selectedAd.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="flex gap-2 sm:justify-between">
                                <Button
                                    variant="destructive"
                                    onClick={() => setRejectDialogOpen(true)}
                                    disabled={actionLoading === selectedAd.id}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setViewDialogOpen(false)}
                                        disabled={actionLoading === selectedAd.id}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => handleApprove(selectedAd.id)}
                                        disabled={actionLoading === selectedAd.id}
                                    >
                                        {actionLoading === selectedAd.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Approve Ad
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Reason Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Advertisement</DialogTitle>
                        <DialogDescription>
                            Please provide a reason why this advertisement is being rejected. The user will see this.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="Ad images contain prohibited content..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={actionLoading === selectedAd?.id || !rejectionReason}
                        >
                            {actionLoading === selectedAd?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Confirm Rejection'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
