'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// ============================================================================
// TYPES
// ============================================================================

export interface ReportMetrics {
    total_revenue?: boolean;
    total_shipments?: boolean;
    total_users?: boolean;
    total_bids?: boolean;
    revenue_trend?: boolean;
    user_growth?: boolean;
    [key: string]: boolean | undefined;
}

export interface ReportDimensions {
    date_range?: '7_days' | '30_days' | '90_days' | 'ytd';
    filters?: Record<string, any>;
    segments?: string[];
}

export interface SavedReport {
    id: string;
    report_name: string;
    report_description?: string;
    metrics: ReportMetrics;
    dimensions?: ReportDimensions;
    visualization_type: 'table' | 'line' | 'bar' | 'pie' | 'area';
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
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('generate_custom_report', {
            p_metrics: metrics,
            p_dimensions: dimensions || {}
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
    visualizationType: 'table' | 'line' | 'bar' | 'pie' | 'area',
    isPublic: boolean = false
) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('save_report_configuration', {
            p_admin_user_id: user.id,
            p_report_name: reportName,
            p_report_description: reportDescription,
            p_metrics: metrics,
            p_dimensions: dimensions,
            p_visualization_type: visualizationType,
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

export async function getUserAcquisitionReport(dateRange: string = '30_days') {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_user_acquisition_report', {
            p_date_range: dateRange
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
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_shipment_performance_report', {
            p_date_range: dateRange
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
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_financial_performance_report', {
            p_date_range: dateRange
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
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_carrier_performance_leaderboard', {
            p_limit: limit,
            p_date_range: dateRange
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
        const supabase = await createClient();

        const { data, error } = await supabase.rpc('get_bidding_analytics_report', {
            p_date_range: dateRange
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
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase.rpc('schedule_automated_report', {
            p_admin_user_id: user.id,
            p_report_config_id: reportConfigId,
            p_report_name: reportName,
            p_frequency: frequency,
            p_schedule_time: scheduleTime,
            p_schedule_day_of_week: scheduleDayOfWeek,
            p_schedule_day_of_month: scheduleDayOfMonth,
            p_recipient_emails: recipientEmails,
            p_export_format: exportFormat
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
        const supabase = await createClient();

        const { error } = await supabase
            .from('scheduled_reports')
            .delete()
            .eq('id', scheduleId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting scheduled report:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleScheduledReport(scheduleId: string, isActive: boolean) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('scheduled_reports')
            .update({ is_active: isActive })
            .eq('id', scheduleId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('Error toggling scheduled report:', error);
        return { success: false, error: error.message };
    }
}
