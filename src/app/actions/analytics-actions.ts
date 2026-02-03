'use server';

import { CarrierAnalyticsService } from '@/lib/services/analytics-service';
import { createClient } from '@/lib/supabase/server';

const service = new CarrierAnalyticsService();

export async function getCarrierKPIs(startDate?: string, endDate?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Verify role is transporter (optional but good practice)

    return await service.getKPIs(user.id, startDate, endDate);
}

export async function getRevenueTrends(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getRevenueTrends(user.id, period);
}

export async function getVehicleUtilization() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getVehicleUtilization(user.id);
}

export async function getDriverPerformance() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getDriverPerformance(user.id);
}

export async function getRouteProfitability() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    return await service.getRouteProfitability(user.id);
}
