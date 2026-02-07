'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    getScheduledReports,
    scheduleReport,
    deleteScheduledReport,
    toggleScheduledReport
} from '@/actions/admin-reporting-actions';
import { FileDown, Calendar, Mail, Trash2, Power, PowerOff, Loader2 } from 'lucide-react';

export default function ExportManager() {
    const [scheduledReports, setScheduledReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleForm, setShowScheduleForm] = useState(false);

    // Form state
    const [reportName, setReportName] = useState('');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [scheduleTime, setScheduleTime] = useState('09:00');
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [dayOfMonth, setDayOfMonth] = useState(1);
    const [recipientEmails, setRecipientEmails] = useState('');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');

    useEffect(() => {
        loadScheduledReports();
    }, []);

    const loadScheduledReports = async () => {
        setLoading(true);
        try {
            const result = await getScheduledReports();
            if (result.success) {
                setScheduledReports(result.data || []);
            }
        } catch (error) {
            toast.error('Failed to load scheduled reports');
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleReport = async () => {
        if (!reportName.trim()) {
            toast.error('Please enter a report name');
            return;
        }

        if (!recipientEmails.trim()) {
            toast.error('Please enter at least one recipient email');
            return;
        }

        const emails = recipientEmails.split(',').map(e => e.trim()).filter(e => e);

        try {
            const result = await scheduleReport(
                null,
                reportName,
                frequency,
                scheduleTime,
                frequency === 'weekly' ? dayOfWeek : undefined,
                frequency === 'monthly' ? dayOfMonth : undefined,
                emails,
                exportFormat
            );

            if (result.success) {
                toast.success('Report scheduled successfully');
                setShowScheduleForm(false);
                resetForm();
                loadScheduledReports();
            } else {
                toast.error(result.error || 'Failed to schedule report');
            }
        } catch (error) {
            toast.error('An error occurred while scheduling the report');
        }
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm('Are you sure you want to delete this scheduled report?')) {
            return;
        }

        try {
            const result = await deleteScheduledReport(scheduleId);
            if (result.success) {
                toast.success('Scheduled report deleted');
                loadScheduledReports();
            } else {
                toast.error(result.error || 'Failed to delete scheduled report');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
        try {
            const result = await toggleScheduledReport(scheduleId, !isActive);
            if (result.success) {
                toast.success(`Scheduled report ${!isActive ? 'activated' : 'deactivated'}`);
                loadScheduledReports();
            } else {
                toast.error(result.error || 'Failed to update scheduled report');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const resetForm = () => {
        setReportName('');
        setFrequency('weekly');
        setScheduleTime('09:00');
        setDayOfWeek(1);
        setDayOfMonth(1);
        setRecipientEmails('');
        setExportFormat('pdf');
    };

    return (
        <div className="space-y-6">
            {/* Export Options */}
            <Card>
                <CardHeader>
                    <CardTitle>Export & Scheduling</CardTitle>
                    <CardDescription>
                        Export reports and schedule automated delivery
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export to PDF
                        </Button>
                        <Button variant="outline" className="flex-1">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export to CSV
                        </Button>
                        <Button variant="outline" className="flex-1">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export to Excel
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        Generate a report first to enable export functionality
                    </p>
                </CardContent>
            </Card>

            {/* Schedule New Report */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Scheduled Reports</CardTitle>
                            <CardDescription>
                                Automate report generation and delivery
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowScheduleForm(!showScheduleForm)}>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule New Report
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showScheduleForm && (
                        <div className="mb-6 p-4 border rounded-lg space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="report-name">Report Name</Label>
                                    <Input
                                        id="report-name"
                                        placeholder="e.g., Weekly Revenue Report"
                                        value={reportName}
                                        onChange={(e) => setReportName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequency</Label>
                                    <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                                        <SelectTrigger id="frequency">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="schedule-time">Time</Label>
                                    <Input
                                        id="schedule-time"
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(e) => setScheduleTime(e.target.value)}
                                    />
                                </div>

                                {frequency === 'weekly' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="day-of-week">Day of Week</Label>
                                        <Select value={dayOfWeek.toString()} onValueChange={(value) => setDayOfWeek(parseInt(value))}>
                                            <SelectTrigger id="day-of-week">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0">Sunday</SelectItem>
                                                <SelectItem value="1">Monday</SelectItem>
                                                <SelectItem value="2">Tuesday</SelectItem>
                                                <SelectItem value="3">Wednesday</SelectItem>
                                                <SelectItem value="4">Thursday</SelectItem>
                                                <SelectItem value="5">Friday</SelectItem>
                                                <SelectItem value="6">Saturday</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {frequency === 'monthly' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="day-of-month">Day of Month</Label>
                                        <Input
                                            id="day-of-month"
                                            type="number"
                                            min="1"
                                            max="31"
                                            value={dayOfMonth}
                                            onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="export-format">Export Format</Label>
                                    <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                                        <SelectTrigger id="export-format">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pdf">PDF</SelectItem>
                                            <SelectItem value="csv">CSV</SelectItem>
                                            <SelectItem value="excel">Excel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="recipients">Recipient Emails (comma-separated)</Label>
                                <Input
                                    id="recipients"
                                    placeholder="admin@example.com, manager@example.com"
                                    value={recipientEmails}
                                    onChange={(e) => setRecipientEmails(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button onClick={handleScheduleReport}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Schedule Report
                                </Button>
                                <Button variant="outline" onClick={() => setShowScheduleForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Scheduled Reports List */}
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : scheduledReports.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No scheduled reports yet. Click "Schedule New Report" to get started.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {scheduledReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{report.report_name}</h4>
                                            <Badge variant={report.is_active ? 'default' : 'secondary'}>
                                                {report.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Badge variant="outline">{report.frequency}</Badge>
                                            <Badge variant="outline">{report.export_format.toUpperCase()}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Next run: {report.next_run_at ? new Date(report.next_run_at).toLocaleString() : 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {report.recipient_emails?.length || 0} recipients
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleSchedule(report.id, report.is_active)}
                                        >
                                            {report.is_active ? (
                                                <PowerOff className="h-4 w-4" />
                                            ) : (
                                                <Power className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteSchedule(report.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
