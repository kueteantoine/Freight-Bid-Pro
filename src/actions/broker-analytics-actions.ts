'use server';

import { createClient } from '@/lib/supabase/server';

// Types
export interface CommissionAnalytics {
    total_revenue: number;
    total_transactions: number;
    average_commission_rate: number;
    profitable_clients: Array<{
        client_id: string;
        client_name: string;
        total_commission: number;
        transaction_count: number;
        average_commission: number;
        profit_margin: number;
    }>;
    profitable_routes: Array<{
        route: string;
        origin: string;
        destination: string;
        total_commission: number;
        transaction_count: number;
        average_commission: number;
    }>;
    commission_by_freight_type: Array<{
        freight_type: string;
        total_commission: number;
        transaction_count: number;
        average_commission: number;
    }>;
}

export interface CommissionTrends {
    period: string;
    data: Array<{
        date: string;
        total_commission: number;
        transaction_count: number;
        average_commission: number;
    }>;
}

/**
 * Get comprehensive commission analytics
 */
export async function getCommissionAnalytics(dateRange?: { start: string; end: string }): Promise<{ data: CommissionAnalytics | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        // Build base query
        let query = supabase
            .from('broker_commissions')
            .select('*')
            .eq('broker_user_id', user.id);

        if (dateRange) {
            query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
        }

        const { data: commissions, error } = await query;
        if (error) throw error;

        // Calculate total revenue and transactions
        const total_revenue = commissions?.reduce((sum, c) => sum + parseFloat(c.commission_amount.toString()), 0) || 0;
        const total_transactions = commissions?.length || 0;
        const average_commission_rate = total_transactions > 0
            ? commissions!.reduce((sum, c) => sum + parseFloat(c.commission_rate.toString()), 0) / total_transactions
            : 0;

        // Analyze profitable clients
        const clientMap = new Map<string, { total: number; count: number; gross_total: number }>();
        commissions?.forEach(c => {
            if (c.shipper_user_id) {
                const current = clientMap.get(c.shipper_user_id) || { total: 0, count: 0, gross_total: 0 };
                clientMap.set(c.shipper_user_id, {
                    total: current.total + parseFloat(c.commission_amount.toString()),
                    count: current.count + 1,
                    gross_total: current.gross_total + parseFloat(c.gross_amount.toString())
                });
            }
        });

        const profitable_clients = await Promise.all(
            Array.from(clientMap.entries())
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 10)
                .map(async ([client_id, data]) => {
                    const { data: userData } = await supabase
                        .from('user_roles')
                        .select('role_specific_profile')
                        .eq('user_id', client_id)
                        .eq('role_type', 'shipper')
                        .single();

                    const client_name = userData?.role_specific_profile?.company_name || 'Unknown Client';

                    return {
                        client_id,
                        client_name,
                        total_commission: data.total,
                        transaction_count: data.count,
                        average_commission: data.total / data.count,
                        profit_margin: data.gross_total > 0 ? (data.total / data.gross_total) * 100 : 0
                    };
                })
        );

        // Analyze profitable routes
        const routeMap = new Map<string, { total: number; count: number; origin: string; destination: string }>();

        for (const commission of commissions || []) {
            if (commission.shipment_id) {
                const { data: shipment } = await supabase
                    .from('shipments')
                    .select('pickup_location, delivery_location')
                    .eq('id', commission.shipment_id)
                    .single();

                if (shipment) {
                    const routeKey = `${shipment.pickup_location} → ${shipment.delivery_location}`;
                    const current = routeMap.get(routeKey) || { total: 0, count: 0, origin: shipment.pickup_location, destination: shipment.delivery_location };
                    routeMap.set(routeKey, {
                        total: current.total + parseFloat(commission.commission_amount.toString()),
                        count: current.count + 1,
                        origin: shipment.pickup_location,
                        destination: shipment.delivery_location
                    });
                }
            }
        }

        const profitable_routes = Array.from(routeMap.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 10)
            .map(([route, data]) => ({
                route,
                origin: data.origin,
                destination: data.destination,
                total_commission: data.total,
                transaction_count: data.count,
                average_commission: data.total / data.count
            }));

        // Analyze commission by freight type
        const freightTypeMap = new Map<string, { total: number; count: number }>();

        for (const commission of commissions || []) {
            if (commission.shipment_id) {
                const { data: shipment } = await supabase
                    .from('shipments')
                    .select('freight_type')
                    .eq('id', commission.shipment_id)
                    .single();

                if (shipment && shipment.freight_type) {
                    const current = freightTypeMap.get(shipment.freight_type) || { total: 0, count: 0 };
                    freightTypeMap.set(shipment.freight_type, {
                        total: current.total + parseFloat(commission.commission_amount.toString()),
                        count: current.count + 1
                    });
                }
            }
        }

        const commission_by_freight_type = Array.from(freightTypeMap.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .map(([freight_type, data]) => ({
                freight_type,
                total_commission: data.total,
                transaction_count: data.count,
                average_commission: data.total / data.count
            }));

        const analytics: CommissionAnalytics = {
            total_revenue,
            total_transactions,
            average_commission_rate,
            profitable_clients,
            profitable_routes,
            commission_by_freight_type
        };

        return { data: analytics, error: null };
    } catch (error: any) {
        console.error('Error fetching commission analytics:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get commission trends over time
 */
export async function getCommissionTrends(period: 'daily' | 'weekly' | 'monthly' = 'monthly', months: number = 12): Promise<{ data: CommissionTrends | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const trends: Array<{ date: string; total_commission: number; transaction_count: number; average_commission: number }> = [];

        if (period === 'monthly') {
            for (let i = months - 1; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

                const { data: monthlyData } = await supabase
                    .from('broker_commissions')
                    .select('commission_amount')
                    .eq('broker_user_id', user.id)
                    .gte('created_at', monthStart)
                    .lte('created_at', monthEnd);

                const total_commission = monthlyData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;
                const transaction_count = monthlyData?.length || 0;
                const average_commission = transaction_count > 0 ? total_commission / transaction_count : 0;

                trends.push({
                    date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                    total_commission,
                    transaction_count,
                    average_commission
                });
            }
        }

        return {
            data: {
                period,
                data: trends
            },
            error: null
        };
    } catch (error: any) {
        console.error('Error fetching commission trends:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get most profitable routes
 */
export async function getProfitableRoutes(limit: number = 10): Promise<{ data: any[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: commissions, error } = await supabase
            .from('broker_commissions')
            .select('shipment_id, commission_amount')
            .eq('broker_user_id', user.id)
            .not('shipment_id', 'is', null);

        if (error) throw error;

        const routeMap = new Map<string, { total: number; count: number; origin: string; destination: string }>();

        for (const commission of commissions || []) {
            const { data: shipment } = await supabase
                .from('shipments')
                .select('pickup_location, delivery_location')
                .eq('id', commission.shipment_id)
                .single();

            if (shipment) {
                const routeKey = `${shipment.pickup_location} → ${shipment.delivery_location}`;
                const current = routeMap.get(routeKey) || { total: 0, count: 0, origin: shipment.pickup_location, destination: shipment.delivery_location };
                routeMap.set(routeKey, {
                    total: current.total + parseFloat(commission.commission_amount.toString()),
                    count: current.count + 1,
                    origin: shipment.pickup_location,
                    destination: shipment.delivery_location
                });
            }
        }

        const routes = Array.from(routeMap.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, limit)
            .map(([route, data]) => ({
                route,
                origin: data.origin,
                destination: data.destination,
                total_commission: data.total,
                transaction_count: data.count,
                average_commission: data.total / data.count
            }));

        return { data: routes, error: null };
    } catch (error: any) {
        console.error('Error fetching profitable routes:', error);
        return { data: null, error: error.message };
    }
}
