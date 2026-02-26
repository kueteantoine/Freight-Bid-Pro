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
import { getAllAdvertisements, pauseAdvertisement, resumeAdvertisement } from '@/lib/services/admin/advertisements';
import { Eye, MousePointerClick, Pause, Play, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface AdListProps {
    status?: 'active' | 'paused' | 'approved' | 'rejected';
}

export function AdList({ status }: AdListProps) {
    const [ads, setAds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchAds();
    }, [status]);

    async function fetchAds() {
        setLoading(true);
        const result = await getAllAdvertisements(
            status ? { approval_status: status as any } : undefined
        );
        if (result.success) {
            setAds(result.data || []);
        }
        setLoading(false);
    }

    async function handlePause(adId: string) {
        const result = await pauseAdvertisement(adId);
        if (result.success) {
            toast({
                title: 'Advertisement Paused',
                description: 'The advertisement has been paused.',
            });
            fetchAds();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to pause advertisement',
                variant: 'destructive',
            });
        }
    }

    async function handleResume(adId: string) {
        const result = await resumeAdvertisement(adId);
        if (result.success) {
            toast({
                title: 'Advertisement Resumed',
                description: 'The advertisement is now active.',
            });
            fetchAds();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to resume advertisement',
                variant: 'destructive',
            });
        }
    }

    function getStatusBadge(status: string) {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            paused: 'secondary',
            approved: 'outline',
            rejected: 'destructive',
            expired: 'secondary',
        };

        return (
            <Badge variant={variants[status] || 'outline'}>
                {status.replace('_', ' ')}
            </Badge>
        );
    }

    if (loading) {
        return <div>Loading advertisements...</div>;
    }

    if (ads.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>No Advertisements</CardTitle>
                    <CardDescription>
                        {status ? `No ${status} advertisements found` : 'No advertisements found'}
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Advertisements</CardTitle>
                <CardDescription>
                    {ads.length} advertisement{ads.length !== 1 ? 's' : ''} found
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Placement</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Performance</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ads.map((ad) => (
                            <TableRow key={ad.id}>
                                <TableCell className="font-medium">{ad.ad_title}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {ad.ad_placement_zone?.replace('_', ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>{getStatusBadge(ad.approval_status)}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            {ad.impressions_count?.toLocaleString() || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MousePointerClick className="h-3 w-3" />
                                            {ad.clicks_count?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {new Date(ad.start_date).toLocaleDateString()} -{' '}
                                    {new Date(ad.end_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Link href={`/admin/advertisements/${ad.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <BarChart3 className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {ad.approval_status === 'active' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handlePause(ad.id)}
                                            >
                                                <Pause className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {ad.approval_status === 'paused' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleResume(ad.id)}
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
