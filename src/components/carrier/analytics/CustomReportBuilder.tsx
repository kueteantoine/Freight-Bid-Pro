"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { FileDown, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomReportBuilder() {
    const [reportName, setReportName] = useState("Monthly Performance Report");
    const [format, setFormat] = useState("pdf");
    const [loading, setLoading] = useState(false);

    const metrics = [
        { id: 'revenue', label: 'Total Revenue' },
        { id: 'shipments', label: 'Shipment Count' },
        { id: 'on_time', label: 'On-Time Performance' },
        { id: 'utilization', label: 'Vehicle Utilization' },
        { id: 'expenses', label: 'Expense Breakdown' },
        { id: 'benchmarking', label: 'Competitor Benchmark' },
    ];

    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'shipments']);

    const toggleMetric = (id: string) => {
        if (selectedMetrics.includes(id)) {
            setSelectedMetrics(prev => prev.filter(m => m !== id));
        } else {
            setSelectedMetrics(prev => [...prev, id]);
        }
    };

    const handleExport = () => {
        setLoading(true);
        // Simulate generation delay
        setTimeout(() => {
            setLoading(false);
            toast.success(`Report "${reportName}" exported as ${format.toUpperCase()}`, {
                description: `Includes: ${selectedMetrics.join(', ')}`
            });
        }, 1500);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Custom Report Builder</CardTitle>
                <CardDescription>Select metrics and export detailed performance reports.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="report-name">Report Title</Label>
                            <Input
                                id="report-name"
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date Range</Label>
                                <Select defaultValue="last_30">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="last_7">Last 7 Days</SelectItem>
                                        <SelectItem value="last_30">Last 30 Days</SelectItem>
                                        <SelectItem value="last_90">Last Quarter</SelectItem>
                                        <SelectItem value="ytd">Year to Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <Select value={format} onValueChange={setFormat}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">PDF Document</SelectItem>
                                        <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                                        <SelectItem value="excel">Excel Workbook</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Metrics to Include</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {metrics.map((metric) => (
                                    <div key={metric.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={metric.id}
                                            checked={selectedMetrics.includes(metric.id)}
                                            onCheckedChange={() => toggleMetric(metric.id)}
                                        />
                                        <label htmlFor={metric.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                            {metric.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/20">
                        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Ready to Export</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-xs mt-2">
                            {selectedMetrics.length} metrics selected for export. The generated report will cover the last 30 days.
                        </p>
                        <Button className="mt-6" onClick={handleExport} disabled={loading || selectedMetrics.length === 0}>
                            {loading ? "Generating..." : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Export Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
