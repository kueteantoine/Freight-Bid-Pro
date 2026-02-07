'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    getReportTemplates,
    getUserAcquisitionReport,
    getShipmentPerformanceReport,
    getFinancialPerformanceReport,
    getCarrierLeaderboard,
    getBiddingAnalyticsReport
} from '@/actions/admin-reporting-actions';
import { Users, Package, DollarSign, Award, TrendingUp, Loader2, FileText } from 'lucide-react';

const iconMap = {
    Users,
    Package,
    DollarSign,
    Award,
    TrendingUp
};

export default function ReportTemplates() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState('30_days');
    const [reportData, setReportData] = useState<any>(null);
    const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const result = await getReportTemplates();
            if (result.success) {
                setTemplates(result.data || []);
            }
        } catch (error) {
            toast.error('Failed to load report templates');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateTemplate = async (templateId: string) => {
        setGeneratingId(templateId);
        setActiveTemplate(templateId);
        setReportData(null);

        try {
            let result;

            switch (templateId) {
                case 'user_acquisition':
                    result = await getUserAcquisitionReport(dateRange);
                    break;
                case 'shipment_performance':
                    result = await getShipmentPerformanceReport(dateRange);
                    break;
                case 'financial_performance':
                    result = await getFinancialPerformanceReport(dateRange);
                    break;
                case 'carrier_leaderboard':
                    result = await getCarrierLeaderboard(10, dateRange);
                    break;
                case 'bidding_analytics':
                    result = await getBiddingAnalyticsReport(dateRange);
                    break;
                default:
                    throw new Error('Unknown template');
            }

            if (result.success) {
                setReportData(result.data);
                toast.success('Report generated successfully');
            } else {
                toast.error(result.error || 'Failed to generate report');
            }
        } catch (error) {
            toast.error('An error occurred while generating the report');
        } finally {
            setGeneratingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Pre-built Report Templates</CardTitle>
                    <CardDescription>
                        Quick access to commonly used reports with one-click generation
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Label className="text-sm font-medium">Date Range:</Label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7_days">Last 7 Days</SelectItem>
                                <SelectItem value="30_days">Last 30 Days</SelectItem>
                                <SelectItem value="90_days">Last 90 Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Template Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => {
                    const Icon = iconMap[template.icon as keyof typeof iconMap] || FileText;
                    const isGenerating = generatingId === template.id;
                    const isActive = activeTemplate === template.id;

                    return (
                        <Card
                            key={template.id}
                            className={`transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-primary/10 p-2">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{template.name}</CardTitle>
                                        </div>
                                    </div>
                                </div>
                                <CardDescription className="mt-2">
                                    {template.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-1">
                                        {template.metrics.slice(0, 3).map((metric: string) => (
                                            <Badge key={metric} variant="secondary" className="text-xs">
                                                {metric.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                        {template.metrics.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{template.metrics.length - 3} more
                                            </Badge>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => handleGenerateTemplate(template.id)}
                                        disabled={isGenerating}
                                        className="w-full"
                                        size="sm"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Generate Report
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Report Data Display */}
            {reportData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Report Data</CardTitle>
                        <CardDescription>
                            Generated report for {templates.find(t => t.id === activeTemplate)?.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg bg-muted p-4">
                            <pre className="text-sm overflow-auto max-h-96">
                                {JSON.stringify(reportData, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <label className={className}>{children}</label>;
}
