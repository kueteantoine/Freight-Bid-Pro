'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { generateCustomReport, saveReportConfiguration } from '@/actions/admin-reporting-actions';
import { Loader2, Save, Play } from 'lucide-react';

export default function ReportBuilder() {
    const [reportName, setReportName] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [dateRange, setDateRange] = useState('30_days');
    const [visualizationType, setVisualizationType] = useState<'table' | 'line' | 'bar' | 'pie' | 'area'>('line');
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const availableMetrics = [
        { id: 'total_revenue', label: 'Total Revenue', description: 'Platform commission revenue' },
        { id: 'total_shipments', label: 'Total Shipments', description: 'Number of shipments created' },
        { id: 'total_users', label: 'Total Users', description: 'New user registrations' },
        { id: 'total_bids', label: 'Total Bids', description: 'Number of bids submitted' },
        { id: 'revenue_trend', label: 'Revenue Trend', description: 'Daily revenue over time' },
        { id: 'user_growth', label: 'User Growth', description: 'Daily user registrations' },
    ];

    const [selectedMetrics, setSelectedMetrics] = useState<Record<string, boolean>>({
        total_revenue: true,
        revenue_trend: true,
    });

    const toggleMetric = (metricId: string) => {
        setSelectedMetrics(prev => ({
            ...prev,
            [metricId]: !prev[metricId]
        }));
    };

    const handleGenerateReport = async () => {
        const activeMetrics = Object.keys(selectedMetrics).filter(key => selectedMetrics[key]);

        if (activeMetrics.length === 0) {
            toast.error('Please select at least one metric');
            return;
        }

        setLoading(true);
        try {
            const result = await generateCustomReport(selectedMetrics, { date_range: dateRange as any });

            if (result.success) {
                setReportData(result.data);
                toast.success('Report generated successfully');
            } else {
                toast.error(result.error || 'Failed to generate report');
            }
        } catch (error) {
            toast.error('An error occurred while generating the report');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveReport = async () => {
        if (!reportName.trim()) {
            toast.error('Please enter a report name');
            return;
        }

        const activeMetrics = Object.keys(selectedMetrics).filter(key => selectedMetrics[key]);
        if (activeMetrics.length === 0) {
            toast.error('Please select at least one metric');
            return;
        }

        setLoading(true);
        try {
            const result = await saveReportConfiguration(
                reportName,
                reportDescription,
                selectedMetrics,
                { date_range: dateRange as any },
                visualizationType,
                isPublic
            );

            if (result.success) {
                toast.success('Report configuration saved successfully');
                setReportName('');
                setReportDescription('');
            } else {
                toast.error(result.error || 'Failed to save report');
            }
        } catch (error) {
            toast.error('An error occurred while saving the report');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Custom Report Builder</CardTitle>
                    <CardDescription>
                        Select metrics and dimensions to create a custom report
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Report Configuration */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="report-name">Report Name</Label>
                            <Input
                                id="report-name"
                                placeholder="e.g., Monthly Revenue Analysis"
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date-range">Date Range</Label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger id="date-range">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7_days">Last 7 Days</SelectItem>
                                    <SelectItem value="30_days">Last 30 Days</SelectItem>
                                    <SelectItem value="90_days">Last 90 Days</SelectItem>
                                    <SelectItem value="ytd">Year to Date</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="report-description">Description (Optional)</Label>
                        <Textarea
                            id="report-description"
                            placeholder="Describe the purpose of this report..."
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Metrics Selection */}
                    <div className="space-y-3">
                        <Label>Select Metrics</Label>
                        <div className="grid gap-3 md:grid-cols-2">
                            {availableMetrics.map((metric) => (
                                <div
                                    key={metric.id}
                                    className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <Checkbox
                                        id={metric.id}
                                        checked={selectedMetrics[metric.id] || false}
                                        onCheckedChange={() => toggleMetric(metric.id)}
                                    />
                                    <div className="flex-1 space-y-1">
                                        <label
                                            htmlFor={metric.id}
                                            className="text-sm font-medium leading-none cursor-pointer"
                                        >
                                            {metric.label}
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            {metric.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visualization Type */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="viz-type">Visualization Type</Label>
                            <Select value={visualizationType} onValueChange={(value: any) => setVisualizationType(value)}>
                                <SelectTrigger id="viz-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="table">Table</SelectItem>
                                    <SelectItem value="line">Line Chart</SelectItem>
                                    <SelectItem value="bar">Bar Chart</SelectItem>
                                    <SelectItem value="pie">Pie Chart</SelectItem>
                                    <SelectItem value="area">Area Chart</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is-public"
                                    checked={isPublic}
                                    onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                                />
                                <label
                                    htmlFor="is-public"
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    Share with other admins
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            onClick={handleGenerateReport}
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Generate Report
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleSaveReport}
                            disabled={loading}
                            variant="outline"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Report Preview */}
            {reportData && (
                <Card>
                    <CardHeader>
                        <CardTitle>Report Preview</CardTitle>
                        <CardDescription>Generated report data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg bg-muted p-4">
                            <pre className="text-sm overflow-auto">
                                {JSON.stringify(reportData, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
