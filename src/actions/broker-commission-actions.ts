'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export type CommissionType = 'shipper_side' | 'carrier_side' | 'both';
export type BrokerPaymentStatus = 'pending' | 'scheduled' | 'processing' | 'paid' | 'failed' | 'cancelled';

export interface BrokerCommission {
    id: string;
    broker_user_id: string;
    transaction_id: string | null;
    shipment_id: string | null;
    shipper_user_id: string | null;
    carrier_user_id: string | null;
    gross_amount: number;
    commission_rate: number;
    commission_amount: number;
    commission_type: CommissionType;
    payment_status: BrokerPaymentStatus;
    payment_date: string | null;
    payment_reference: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface CommissionDashboardMetrics {
    total_commissions_earned: number;
    total_commissions_this_month: number;
    total_commissions_this_year: number;
    average_commission_per_transaction: number;
    commission_as_shipper: number;
    commission_as_carrier: number;
    pending_commissions: number;
    paid_commissions: number;
    top_earning_clients: Array<{
        client_id: string;
        client_name: string;
        total_commission: number;
        transaction_count: number;
    }>;
    monthly_trends: Array<{
        month: string;
        total_commission: number;
        transaction_count: number;
    }>;
}

export interface CommissionFilters {
    start_date?: string;
    end_date?: string;
    client_id?: string;
    status?: BrokerPaymentStatus;
    commission_type?: CommissionType;
    page?: number;
    limit?: number;
}

/**
 * Get broker commission dashboard metrics
 */
export async function getBrokerCommissionDashboard(): Promise<{ data: CommissionDashboardMetrics | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        // Get total commissions earned (all-time)
        const { data: totalData, error: totalError } = await supabase
            .from('broker_commissions')
            .select('commission_amount')
            .eq('broker_user_id', user.id);

        if (totalError) throw totalError;

        const total_commissions_earned = totalData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;

        // Get this month's commissions
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: monthData, error: monthError } = await supabase
            .from('broker_commissions')
            .select('commission_amount')
            .eq('broker_user_id', user.id)
            .gte('created_at', startOfMonth);

        if (monthError) throw monthError;

        const total_commissions_this_month = monthData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;

        // Get this year's commissions
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const { data: yearData, error: yearError } = await supabase
            .from('broker_commissions')
            .select('commission_amount')
            .eq('broker_user_id', user.id)
            .gte('created_at', startOfYear);

        if (yearError) throw yearError;

        const total_commissions_this_year = yearData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;

        // Get average commission per transaction
        const transaction_count = totalData?.length || 0;
        const average_commission_per_transaction = transaction_count > 0 ? total_commissions_earned / transaction_count : 0;

        // Get commissions by type
        const { data: shipperSideData } = await supabase
            .from('broker_commissions')
            .select('commission_amount')
            .eq('broker_user_id', user.id)
            .eq('commission_type', 'shipper_side');

        const commission_as_shipper = shipperSideData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;

        const { data: carrierSideData } = await supabase
            .from('broker_commissions')
            .select('commission_amount')
            .eq('broker_user_id', user.id)
            .eq('commission_type', 'carrier_side');

        const commission_as_carrier = carrierSideData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;

        // Get pending and paid commissions
        const { data: pendingData } = await supabase
            .from('broker_commissions')
            .select('commission_amount')
            .eq('broker_user_id', user.id)
            .eq('payment_status', 'pending');

        const pending_commissions = pendingData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;

        const { data: paidData } = await supabase
            .from('broker_commissions')
            .select('commission_amount')
            .eq('broker_user_id', user.id)
            .eq('payment_status', 'paid');

        const paid_commissions = paidData?.reduce((sum, item) => sum + parseFloat(item.commission_amount.toString()), 0) || 0;

        // Get top earning clients
        const { data: clientsData, error: clientsError } = await supabase
            .from('broker_commissions')
            .select(`
        shipper_user_id,
        commission_amount
      `)
            .eq('broker_user_id', user.id)
            .not('shipper_user_id', 'is', null);

        if (clientsError) throw clientsError;

        // Aggregate by client
        const clientMap = new Map<string, { total: number; count: number }>();
        clientsData?.forEach(item => {
            const clientId = item.shipper_user_id!;
            const current = clientMap.get(clientId) || { total: 0, count: 0 };
            clientMap.set(clientId, {
                total: current.total + parseFloat(item.commission_amount.toString()),
                count: current.count + 1
            });
        });

        // Get client names and sort
        const top_earning_clients = await Promise.all(
            Array.from(clientMap.entries())
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, 5)
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
                        transaction_count: data.count
                    };
                })
        );

        // Get monthly trends (last 12 months)
        const monthly_trends = [];
        for (let i = 11; i >= 0; i--) {
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

            monthly_trends.push({
                month: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                total_commission,
                transaction_count: monthlyData?.length || 0
            });
        }

        const metrics: CommissionDashboardMetrics = {
            total_commissions_earned,
            total_commissions_this_month,
            total_commissions_this_year,
            average_commission_per_transaction,
            commission_as_shipper,
            commission_as_carrier,
            pending_commissions,
            paid_commissions,
            top_earning_clients,
            monthly_trends
        };

        return { data: metrics, error: null };
    } catch (error: any) {
        console.error('Error fetching broker commission dashboard:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get broker commissions with filtering and pagination
 */
export async function getBrokerCommissions(filters: CommissionFilters = {}): Promise<{ data: BrokerCommission[] | null; error: string | null; count: number }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized', count: 0 };
        }

        const { page = 1, limit = 20, start_date, end_date, client_id, status, commission_type } = filters;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('broker_commissions')
            .select('*', { count: 'exact' })
            .eq('broker_user_id', user.id);

        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        if (end_date) {
            query = query.lte('created_at', end_date);
        }
        if (client_id) {
            query = query.eq('shipper_user_id', client_id);
        }
        if (status) {
            query = query.eq('payment_status', status);
        }
        if (commission_type) {
            query = query.eq('commission_type', commission_type);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return { data: data as BrokerCommission[], error: null, count: count || 0 };
    } catch (error: any) {
        console.error('Error fetching broker commissions:', error);
        return { data: null, error: error.message, count: 0 };
    }
}

/**
 * Get detailed commission transaction with three-party flow
 */
export async function getCommissionTransaction(transactionId: string): Promise<{ data: any | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        // Get commission record
        const { data: commission, error: commissionError } = await supabase
            .from('broker_commissions')
            .select('*')
            .eq('transaction_id', transactionId)
            .eq('broker_user_id', user.id)
            .single();

        if (commissionError) throw commissionError;

        // Get transaction details
        const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', transactionId)
            .single();

        if (transactionError) throw transactionError;

        // Get shipment details
        const { data: shipment, error: shipmentError } = await supabase
            .from('shipments')
            .select('*')
            .eq('id', commission.shipment_id)
            .single();

        if (shipmentError) throw shipmentError;

        // Get carrier payment details
        const { data: carrierPayment, error: carrierPaymentError } = await supabase
            .from('broker_carrier_payments')
            .select('*')
            .eq('transaction_id', transactionId)
            .single();

        if (carrierPaymentError) throw carrierPaymentError;

        return {
            data: {
                commission,
                transaction,
                shipment,
                carrier_payment: carrierPayment
            },
            error: null
        };
    } catch (error: any) {
        console.error('Error fetching commission transaction:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Calculate commission for a shipment based on configured rates
 */
export async function calculateCommission(shipmentId: string, bidAmount: number): Promise<{ data: { commission_rate: number; commission_amount: number } | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        // Get shipment details
        const { data: shipment, error: shipmentError } = await supabase
            .from('shipments')
            .select('shipper_user_id, pickup_location, delivery_location, freight_type')
            .eq('id', shipmentId)
            .single();

        if (shipmentError) throw shipmentError;

        // Call the database function to calculate commission
        const { data, error } = await supabase.rpc('calculate_broker_commission', {
            p_broker_user_id: user.id,
            p_client_user_id: shipment.shipper_user_id,
            p_shipment_amount: bidAmount,
            p_route_origin: shipment.pickup_location,
            p_route_destination: shipment.delivery_location,
            p_freight_type: shipment.freight_type
        });

        if (error) throw error;

        const commission_amount = parseFloat(data || '0');
        const commission_rate = bidAmount > 0 ? (commission_amount / bidAmount) * 100 : 0;

        return {
            data: {
                commission_rate,
                commission_amount
            },
            error: null
        };
    } catch (error: any) {
        console.error('Error calculating commission:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get top earning clients
 */
export async function getTopEarningClients(limit: number = 10): Promise<{ data: any[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return { data: null, error: 'Unauthorized' };
        }

        const { data: commissions, error } = await supabase
            .from('broker_commissions')
            .select('shipper_user_id, commission_amount')
            .eq('broker_user_id', user.id)
            .not('shipper_user_id', 'is', null);

        if (error) throw error;

        // Aggregate by client
        const clientMap = new Map<string, { total: number; count: number }>();
        commissions?.forEach(item => {
            const clientId = item.shipper_user_id!;
            const current = clientMap.get(clientId) || { total: 0, count: 0 };
            clientMap.set(clientId, {
                total: current.total + parseFloat(item.commission_amount.toString()),
                count: current.count + 1
            });
        });

        // Get client details and sort
        const topClients = await Promise.all(
            Array.from(clientMap.entries())
                .sort((a, b) => b[1].total - a[1].total)
                .slice(0, limit)
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
                        average_commission: data.total / data.count
                    };
                })
        );

        return { data: topClients, error: null };
    } catch (error: any) {
        console.error('Error fetching top earning clients:', error);
        return { data: null, error: error.message };
    }
}
