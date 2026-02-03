import { createClient } from '@/lib/supabase/server';

export class CarrierAnalyticsService {
    async getKPIs(carrierId: string, startDate?: string, endDate?: string) {
        const supabase = await createClient();

        // Default to last 30 days if not provided
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const end = endDate || new Date().toISOString();

        const { data, error } = await supabase
            .rpc('get_transporter_kpis', {
                transporter_uuid: carrierId,
                start_date: start,
                end_date: end
            });

        if (error) throw error;
        return data;
    }

    async getRevenueTrends(carrierId: string, period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
        const supabase = await createClient();

        const { data, error } = await supabase
            .rpc('get_revenue_trends', {
                transporter_uuid: carrierId,
                period_type: period
            });

        if (error) throw error;
        return data;
    }

    async getVehicleUtilization(carrierId: string) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .rpc('get_vehicle_utilization', {
                transporter_uuid: carrierId
            });

        if (error) throw error;
        return data;
    }

    async getDriverPerformance(carrierId: string) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .rpc('get_driver_performance', {
                transporter_uuid: carrierId
            });

        if (error) throw error;
        return data;
    }

    async getRouteProfitability(carrierId: string) {
        const supabase = await createClient();

        const { data, error } = await supabase
            .rpc('get_route_profitability', {
                transporter_uuid: carrierId
            });

        if (error) throw error;
        return data;
    }
}
