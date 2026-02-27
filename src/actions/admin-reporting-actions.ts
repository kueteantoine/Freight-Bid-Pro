'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const ReportMetricsSchema = z.object({
    total_revenue: z.boolean().optional(),
    total_shipments: z.boolean().optional(),
    total_users: z.boolean().optional(),
    total_bids: z.boolean().optional(),
    revenue_trend: z.boolean().optional(),
    user_growth: z.boolean().optional(),
}).catchall(z.boolean().optional());

const DateRangeSchema = z.enum(['7_days', '30_days', '90_days', 'ytd']);

const ReportDimensionsSchema = z.object({
    date_range: DateRangeSchema.optional(),
    filters: z.record(z.any()).optional(),
    segments: z.array(z.string()).optional(),
});

const VisualizationTypeSchema = z.enum(['table', 'line', 'bar', 'pie', 'area']);

// ============================================================================
// TYPES
// ============================================================================

export type ReportMetrics = z.infer<typeof ReportMetricsSchema>;
export type ReportDimensions = z.infer<typeof ReportDimensionsSchema>;

export interface SavedReport {
    id: string;
    report_name: string;
    report_description?: string;
    metrics: ReportMetrics;
    dimensions?: ReportDimensions;
    visualization_type: z.infer<typeof VisualizationTypeSchema>;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface ScheduledReport {
    id: string;
    report_name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    schedule_time: string;
    schedule_day_of_week?: number;
    schedule_day_of_month?: number;
    recipient_emails: string[];
    export_format: 'pdf' | 'csv' | 'excel';
    is_active: boolean;
    last_run_at?: string;
    next_run_at?: string;
    created_at: string;
}

// ============================================================================
// REPORT BUILDER ACTIONS
// ============================================================================

export async function generateCustomReport(
    metrics: ReportMetrics,
    dimensions?: ReportDimensions
) {
    try {
        // Validate inputs
        const validatedMetrics = ReportMetricsSchema.parse(metrics);
        const validatedDimensions = ReportDimensionsSchema.parse(dimensions || {});

        const supabase = await createClient();

        const { data, error } = await supabase.rpc('generate_custom_report', {
            p_metrics: validatedMetrics,
            p_dimensions: validatedDimensions
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error generating custom report:', error);
        return { success: false, error: error.message };
    }
}

export async function getReportTemplates() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_report_templates');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching report templates:', error);
        return { success: false, error: error.message };
    }
}

export async function saveReportConfiguration(
    reportName: string,
    reportDescription: string,
    metrics: ReportMetrics,
    dimensions: ReportDimensions,
    visualizationType: z.infer<typeof VisualizationTypeSchema>,
    isPublic: boolean = false
) {
    try {
        // Validate inputs
        const validatedReportName = z.string().min(1).max(255).parse(reportName);
        const validatedDescription = z.string().max(1000).parse(reportDescription);
        const validatedMetrics = ReportMetricsSchema.parse(metrics);
        const validatedDimensions = ReportDimensionsSchema.parse(dimensions);
        const validatedVizType = VisualizationTypeSchema.parse(visualizationType);

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('save_report_configuration', {
            p_admin_user_id: user.id,
            p_report_name: validatedReportName,
            p_report_description: validatedDescription,
            p_metrics: validatedMetrics,
            p_dimensions: validatedDimensions,
            p_visualization_type: validatedVizType,
            p_is_public: isPublic
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error saving report configuration:', error);
        return { success: false, error: error.message };
    }
}

export async function getSavedReports() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('get_saved_reports', {
            p_admin_user_id: user.id
        });

        if (error) throw error;

        return { success: true, data: data as SavedReport[] };
    } catch (error: any) {
        console.error('Error fetching saved reports:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteReport(reportId: string) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('saved_reports')
            .delete()
            .eq('id', reportId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting report:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// PRE-BUILT REPORT ACTIONS
// ============================================================================

const FrequencySchema = z.enum(['daily', 'weekly', 'monthly']);
const ExportFormatSchema = z.enum(['pdf', 'csv', 'excel']).default('pdf');

// ============================================================================
// PRE-BUILT REPORT ACTIONS
// ============================================================================

export async function getUserAcquisitionReport(dateRange: string = '30_days') {
    try {
        const validatedRange = z.string().parse(dateRange);
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_user_acquisition_report', {
            p_date_range: validatedRange
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching user acquisition report:', error);
        return { success: false, error: error.message };
    }
}

export async function getShipmentPerformanceReport(dateRange: string = '30_days') {
    try {
        const validatedRange = z.string().parse(dateRange);
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_shipment_performance_report', {
            p_date_range: validatedRange
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching shipment performance report:', error);
        return { success: false, error: error.message };
    }
}

export async function getFinancialPerformanceReport(dateRange: string = '30_days') {
    try {
        const validatedRange = z.string().parse(dateRange);
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_financial_performance_report', {
            p_date_range: validatedRange
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching financial performance report:', error);
        return { success: false, error: error.message };
    }
}

export async function getCarrierLeaderboard(limit: number = 10, dateRange: string = '30_days') {
    try {
        const validatedLimit = z.number().int().min(1).max(100).parse(limit);
        const validatedRange = z.string().parse(dateRange);
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_carrier_performance_leaderboard', {
            p_limit: validatedLimit,
            p_date_range: validatedRange
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching carrier leaderboard:', error);
        return { success: false, error: error.message };
    }
}

export async function getBiddingAnalyticsReport(dateRange: string = '30_days') {
    try {
        const validatedRange = z.string().parse(dateRange);
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_bidding_analytics_report', {
            p_date_range: validatedRange
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching bidding analytics report:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// REAL-TIME ANALYTICS ACTIONS
// ============================================================================

export async function getLiveBiddingAnalytics() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_live_bidding_analytics');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching live bidding analytics:', error);
        return { success: false, error: error.message };
    }
}

export async function getPlatformUtilizationMetrics() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_platform_utilization_metrics');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching platform utilization metrics:', error);
        return { success: false, error: error.message };
    }
}

export async function getLiveRevenueTracking() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_live_revenue_tracking');

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching live revenue tracking:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// EXPORT ACTIONS
// ============================================================================

export async function exportReportToPDF(reportData: any, reportName: string) {
    try {
        z.string().min(1).parse(reportName);
        // TODO: Implement PDF generation using jsPDF
        // This will be implemented in the frontend component
        return { success: true, message: 'PDF export initiated' };
    } catch (error: any) {
        console.error('Error exporting to PDF:', error);
        return { success: false, error: error.message };
    }
}

export async function exportReportToCSV(reportData: any, reportName: string) {
    try {
        z.string().min(1).parse(reportName);
        // TODO: Implement CSV generation using papaparse
        // This will be implemented in the frontend component
        return { success: true, message: 'CSV export initiated' };
    } catch (error: any) {
        console.error('Error exporting to CSV:', error);
        return { success: false, error: error.message };
    }
}

export async function exportReportToExcel(reportData: any, reportName: string) {
    try {
        z.string().min(1).parse(reportName);
        // TODO: Implement Excel generation using xlsx
        // This will be implemented in the frontend component
        return { success: true, message: 'Excel export initiated' };
    } catch (error: any) {
        console.error('Error exporting to Excel:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// SCHEDULED REPORT ACTIONS
// ============================================================================

export async function scheduleReport(
    reportConfigId: string | null,
    reportName: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    scheduleTime: string,
    recipientEmails: string[],
    scheduleDayOfWeek?: number,
    scheduleDayOfMonth?: number,
    exportFormat: 'pdf' | 'csv' | 'excel' = 'pdf'
) {
    try {
        // Validate inputs
        const validatedConfigId = z.string().uuid().nullable().parse(reportConfigId);
        const validatedName = z.string().min(1).max(255).parse(reportName);
        const validatedFreq = FrequencySchema.parse(frequency);
        const validatedTime = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).parse(scheduleTime);
        const validatedEmails = z.array(z.string().email()).min(1).parse(recipientEmails);
        const validatedDayOfWeek = z.number().int().min(0).max(6).optional().parse(scheduleDayOfWeek);
        const validatedDayOfMonth = z.number().int().min(1).max(31).optional().parse(scheduleDayOfMonth);
        const validatedFormat = ExportFormatSchema.parse(exportFormat);

        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('schedule_automated_report', {
            p_admin_user_id: user.id,
            p_report_config_id: validatedConfigId,
            p_report_name: validatedName,
            p_frequency: validatedFreq,
            p_schedule_time: validatedTime,
            p_schedule_day_of_week: validatedDayOfWeek,
            p_schedule_day_of_month: validatedDayOfMonth,
            p_recipient_emails: validatedEmails,
            p_export_format: validatedFormat
        });

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('Error scheduling report:', error);
        return { success: false, error: error.message };
    }
}

export async function getScheduledReports() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('get_scheduled_reports', {
            p_admin_user_id: user.id
        });

        if (error) throw error;

        return { success: true, data: data as ScheduledReport[] };
    } catch (error: any) {
        console.error('Error fetching scheduled reports:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteScheduledReport(scheduleId: string) {
    try {
        const validatedId = z.string().uuid().parse(scheduleId);
        const supabase = await createClient();

        const { error } = await supabase
            .from('scheduled_reports')
            .delete()
            .eq('id', validatedId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting scheduled report:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleScheduledReport(scheduleId: string, isActive: boolean) {
    try {
        const validatedId = z.string().uuid().parse(scheduleId);
        const validatedActive = z.boolean().parse(isActive);
        const supabase = await createClient();

        const { error } = await supabase
            .from('scheduled_reports')
            .update({ is_active: validatedActive })
            .eq('id', validatedId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error toggling scheduled report:', error);
        return { success: false, error: error.message };
    }
}
