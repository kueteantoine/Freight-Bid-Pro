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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MoreVertical, Pause, Play, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserAdDialog } from '@/components/ads/user-ad-dialog';
import { UserAdAnalyticsDialog } from '@/components/ads/user-ad-analytics-dialog';
import {
    getUserAdvertisements,
    pauseUserAdvertisement,
    resumeUserAdvertisement,
    deleteUserAdvertisement,
} from '@/app/actions/user-ad-actions';
import { formatDistanceToNow } from 'date-fns';

export function MyAdsCard() {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadAds();
    }, []);

    async function loadAds() {
        setLoading(true);
        const result = await getUserAdvertisements();
        if (result.success) {
            setAds(result.data || []);
        }
        setLoading(false);
    }

    async function handlePause(adId: string) {
        setActionLoading(adId);
        const result = await pauseUserAdvertisement(adId);
        if (result.success) {
            toast({ title: 'Advertisement paused' });
            await loadAds();
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
        setActionLoading(null);
    }

    async function handleResume(adId: string) {
        setActionLoading(adId);
        const result = await resumeUserAdvertisement(adId);
        if (result.success) {
            toast({ title: 'Advertisement resumed' });
            await loadAds();
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
        setActionLoading(null);
    }

    async function handleDelete(adId: string) {
        if (!confirm('Are you sure you want to delete this advertisement?')) return;

        setActionLoading(adId);
        const result = await deleteUserAdvertisement(adId);
        if (result.success) {
            toast({ title: 'Advertisement deleted' });
            await loadAds();
        } else {
            toast({
                title: 'Error',
                description: result.error,
                variant: 'destructive',
            });
        }
        setActionLoading(null);
    }

    function getStatusBadge(status: string) {
        const variants: Record<string, { variant: any; label: string }> = {
            pending_approval: { variant: 'secondary', label: 'Pending Review' },
            active: { variant: 'default', label: 'Active' },
            paused: { variant: 'outline', label: 'Paused' },
            rejected: { variant: 'destructive', label: 'Rejected' },
            expired: { variant: 'secondary', label: 'Expired' },
        };

        const config = variants[status] || { variant: 'secondary', label: status };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>My Advertisements</CardTitle>
                        <CardDescription>Manage your promotional campaigns</CardDescription>
                    </div>
                    <UserAdDialog onSuccess={loadAds} />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : ads.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground mb-4">
                            You haven't created any advertisements yet.
                        </p>
                        <UserAdDialog onSuccess={loadAds} />
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ads.map((ad) => (
                                <TableRow key={ad.id}>
                                    <TableCell className="font-medium">{ad.ad_title}</TableCell>
                                    <TableCell className="capitalize">{ad.ad_type}</TableCell>
                                    <TableCell>{getStatusBadge(ad.approval_status)}</TableCell>
                                    <TableCell>
                                        {new Date(ad.start_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(ad.end_date).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {formatDistanceToNow(new Date(ad.created_at), {
                                            addSuffix: true,
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={actionLoading === ad.id}
                                                >
                                                    {actionLoading === ad.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <MoreVertical className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <UserAdAnalyticsDialog
                                                    adId={ad.id}
                                                    adTitle={ad.ad_title}
                                                />

                                                {ad.approval_status === 'active' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handlePause(ad.id)}
                                                    >
                                                        <Pause className="mr-2 h-4 w-4" />
                                                        Pause
                                                    </DropdownMenuItem>
                                                )}

                                                {ad.approval_status === 'paused' && (
                                                    <DropdownMenuItem
                                                        onClick={() => handleResume(ad.id)}
                                                    >
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Resume
                                                    </DropdownMenuItem>
                                                )}

                                                {['draft', 'rejected'].includes(
                                                    ad.approval_status
                                                ) && (
                                                        <>
                                                            <DropdownMenuItem>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(ad.id)}
                                                                className="text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
