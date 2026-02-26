'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportBuilder from '@/components/admin/reporting/ReportBuilder';
import ReportTemplates from '@/components/admin/reporting/ReportTemplates';
import LiveAnalytics from '@/components/admin/reporting/LiveAnalytics';
import ExportManager from '@/components/admin/reporting/ExportManager';
import { FileText, LayoutTemplate, Activity, Download } from 'lucide-react';

export default function ReportingPage() {
    const [activeTab, setActiveTab] = useState('builder');

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Reporting & Business Intelligence</h1>
                <p className="text-muted-foreground mt-2">
                    Generate custom reports, view real-time analytics, and schedule automated reporting
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="builder" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Report Builder</span>
                        <span className="sm:hidden">Builder</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2">
                        <LayoutTemplate className="h-4 w-4" />
                        <span className="hidden sm:inline">Templates</span>
                        <span className="sm:hidden">Templates</span>
                    </TabsTrigger>
                    <TabsTrigger value="live" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">Live Analytics</span>
                        <span className="sm:hidden">Live</span>
                    </TabsTrigger>
                    <TabsTrigger value="export" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Export & Schedule</span>
                        <span className="sm:hidden">Export</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="space-y-6">
                    <ReportBuilder />
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                    <ReportTemplates />
                </TabsContent>

                <TabsContent value="live" className="space-y-6">
                    <LiveAnalytics />
                </TabsContent>

                <TabsContent value="export" className="space-y-6">
                    <ExportManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
