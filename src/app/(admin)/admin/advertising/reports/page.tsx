'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getAdReportsQueue, resolveAdReport } from '@/app/actions/ad-compliance-actions';
import { Flag, ShieldAlert, CheckCircle, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

export default function AdReportsPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const result = await getAdReportsQueue();
            if (result.success) {
                setReports(result.data || []);
            } else {
                toast.error(result.error || 'Failed to fetch reports');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleResolve = async (reportId: string, status: 'reviewed' | 'resolved' | 'ignored') => {
        setProcessing(reportId);
        try {
            const result = await resolveAdReport(reportId, status, `Manually resolved as ${status}`);
            if (result.success) {
                toast.success(`Report marked as ${status}`);
                setReports(reports.filter(r => r.id !== reportId));
            } else {
                toast.error(result.error || 'Failed to resolve report');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ad Content Moderation</h1>
                    <p className="text-muted-foreground">
                        Review and resolve reports flagged by users.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 text-sm font-bold bg-red-50 text-red-700 border-red-200 uppercase tracking-wider">
                    {reports.length} Pending Reports
                </Badge>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reports Queue</CardTitle>
                    <CardDescription>
                        User flags for misleading, offensive, or broken advertisements.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {reports.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">All Clear!</h3>
                            <p className="text-muted-foreground text-sm">No pending ad reports found.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ad Title</TableHead>
                                    <TableHead>Reporter</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead>Reported At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <div className="font-medium">{report.ad_title}</div>
                                            <div className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">
                                                {report.ad_id}
                                            </div>
                                        </TableCell>
                                        <TableCell>{report.reporter_name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {report.reason.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <p className="text-sm truncate" title={report.details}>
                                                {report.details || <span className="text-muted-foreground italic">No details provided</span>}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(report.created_at), 'MMM d, p')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleResolve(report.id, 'ignored')}
                                                    disabled={processing === report.id}
                                                >
                                                    Dismiss
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleResolve(report.id, 'reviewed')}
                                                    disabled={processing === report.id}
                                                >
                                                    Mark Reviewed
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleResolve(report.id, 'resolved')}
                                                    disabled={processing === report.id}
                                                >
                                                    Resolve & Close
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
