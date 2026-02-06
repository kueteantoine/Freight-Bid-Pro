'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type RuleAction = 'auto_assign' | 'notify_broker' | 'suggest_only';

export interface MatchingRule {
    id: string;
    broker_user_id: string;
    rule_name: string;
    rule_description?: string;
    is_active: boolean;
    priority: number;
    conditions: {
        route_origin?: string;
        route_destination?: string;
        min_carrier_rating?: number;
        max_carrier_rating?: number;
        preferred_carriers?: string[];
        min_margin_percentage?: number;
        freight_types?: string[];
        urgency_level?: string;
        max_distance_km?: number;
    };
    action: RuleAction;
    action_params: {
        require_confirmation?: boolean;
        notification_enabled?: boolean;
    };
    times_triggered: number;
    successful_matches: number;
    last_triggered_at?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Get all matching rules for a broker
 */
export async function getMatchingRules(brokerId: string, activeOnly: boolean = false) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('broker_matching_rules')
            .select('*')
            .eq('broker_user_id', brokerId)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data: data as MatchingRule[], error: null };
    } catch (error: any) {
        console.error('Error fetching matching rules:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Create a new matching rule
 */
export async function createMatchingRule(rule: Omit<MatchingRule, 'id' | 'times_triggered' | 'successful_matches' | 'last_triggered_at' | 'created_at' | 'updated_at'>) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_matching_rules')
            .insert({
                ...rule,
                times_triggered: 0,
                successful_matches: 0,
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating matching rule:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Update an existing matching rule
 */
export async function updateMatchingRule(
    ruleId: string,
    updates: Partial<Omit<MatchingRule, 'id' | 'broker_user_id' | 'created_at' | 'updated_at'>>
) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_matching_rules')
            .update(updates)
            .eq('id', ruleId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating matching rule:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Delete a matching rule
 */
export async function deleteMatchingRule(ruleId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('broker_matching_rules')
            .delete()
            .eq('id', ruleId);

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { error: null };
    } catch (error: any) {
        console.error('Error deleting matching rule:', error);
        return { error: error.message };
    }
}

/**
 * Toggle rule active status
 */
export async function toggleRuleStatus(ruleId: string, isActive: boolean) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('broker_matching_rules')
            .update({ is_active: isActive })
            .eq('id', ruleId)
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/broker/load-matching');
        return { data, error: null };
    } catch (error: any) {
        console.error('Error toggling rule status:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Execute matching rules for a specific shipment
 */
export async function executeMatchingRules(shipmentId: string, brokerId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.rpc('apply_matching_rules', {
            p_shipment_id: shipmentId,
            p_broker_user_id: brokerId,
        });

        if (error) throw error;

        // Process the results
        if (data && data.length > 0) {
            const ruleResults = data.map((result: any) => ({
                rule_id: result.rule_id,
                rule_name: result.rule_name,
                action: result.action,
                matched_carrier_id: result.matched_carrier_id,
                match_score: result.match_score,
            }));

            // If any rules resulted in auto_assign, create the matches
            for (const result of ruleResults) {
                if (result.action === 'auto_assign') {
                    // Create the match
                    await supabase
                        .from('broker_load_matches')
                        .insert({
                            broker_user_id: brokerId,
                            shipment_id: shipmentId,
                            carrier_user_id: result.matched_carrier_id,
                            match_type: 'automated',
                            match_status: 'confirmed',
                            match_score: result.match_score,
                            confirmed_at: new Date().toISOString(),
                        });

                    // Update rule statistics - fetch current value and increment
                    const { data: currentRule } = await supabase
                        .from('broker_matching_rules')
                        .select('successful_matches')
                        .eq('id', result.rule_id)
                        .single();

                    if (currentRule) {
                        await supabase
                            .from('broker_matching_rules')
                            .update({
                                successful_matches: (currentRule.successful_matches || 0) + 1,
                            })
                            .eq('id', result.rule_id);
                    }
                }
            }

            revalidatePath('/broker/load-matching');
            return { data: ruleResults, error: null };
        }

        return { data: [], error: null };
    } catch (error: any) {
        console.error('Error executing matching rules:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Get rule execution history
 */
export async function getRuleExecutionHistory(brokerId: string, ruleId?: string) {
    const supabase = await createClient();

    try {
        let query = supabase
            .from('broker_matching_history')
            .select('*')
            .eq('broker_user_id', brokerId)
            .eq('activity_type', 'rule_triggered')
            .order('created_at', { ascending: false })
            .limit(100);

        if (ruleId) {
            query = query.eq('triggered_by_rule_id', ruleId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };
    } catch (error: any) {
        console.error('Error fetching rule execution history:', error);
        return { data: null, error: error.message };
    }
}

/**
 * Bulk update rule priorities
 */
export async function updateRulePriorities(
    brokerId: string,
    rulePriorities: Array<{ ruleId: string; priority: number }>
) {
    const supabase = await createClient();

    try {
        // Update each rule's priority
        const updates = rulePriorities.map(({ ruleId, priority }) =>
            supabase
                .from('broker_matching_rules')
                .update({ priority })
                .eq('id', ruleId)
                .eq('broker_user_id', brokerId)
        );

        await Promise.all(updates);

        revalidatePath('/broker/load-matching');
        return { error: null };
    } catch (error: any) {
        console.error('Error updating rule priorities:', error);
        return { error: error.message };
    }
}
