"use server";

import { createClient } from "@/lib/supabase/server";
import { parseCSV, validatePartnerRow, type CSVPartnerRow } from "@/lib/utils/csv-utils";

/**
 * CSV Import Service
 * Server actions for bulk importing partners from CSV files
 */

export interface ImportResult {
    success: boolean;
    total_rows: number;
    successful_imports: number;
    failed_imports: number;
    errors: Array<{
        row: number;
        email: string;
        error: string;
    }>;
}

/**
 * Find user by email (server-side helper)
 */
async function findUserByEmail(email: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .single();

    return { data, error };
}

/**
 * Bulk import shippers from CSV
 */
export async function bulkImportShippers(
    csvContent: string
): Promise<{ data: ImportResult | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const rows = parseCSV(csvContent);
        const result: ImportResult = {
            success: true,
            total_rows: rows.length,
            successful_imports: 0,
            failed_imports: 0,
            errors: [],
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +2 because of header and 0-index

            // Validate row
            const validationError = validatePartnerRow(row, rowNumber);
            if (validationError) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: validationError,
                });
                continue;
            }

            // Find user by email
            const { data: userData, error: userError } = await findUserByEmail(row.email);
            if (userError || !userData) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: "User not found in system",
                });
                continue;
            }

            // Check if already in network
            const { data: existing } = await supabase
                .from("broker_shipper_network")
                .select("id")
                .eq("broker_user_id", user.id)
                .eq("shipper_user_id", userData.id)
                .single();

            if (existing) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: "Already in network",
                });
                continue;
            }

            // Import shipper
            const commissionRate = row.commission_rate ? parseFloat(row.commission_rate) : 10;
            const contractDetails: any = {};

            if (row.company_name) {
                contractDetails.company_name = row.company_name;
            }

            const { error: insertError } = await supabase
                .from("broker_shipper_network")
                .insert({
                    broker_user_id: user.id,
                    shipper_user_id: userData.id,
                    commission_rate: commissionRate,
                    contract_details: contractDetails,
                    notes: row.notes || "",
                    relationship_status: "active",
                });

            if (insertError) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: insertError.message,
                });
            } else {
                result.successful_imports++;
            }
        }

        result.success = result.failed_imports === 0;

        return { data: result, error: null };
    } catch (error: any) {
        console.error("Error in bulkImportShippers:", error);
        return { data: null, error: error.message };
    }
}

/**
 * Bulk import carriers from CSV
 */
export async function bulkImportCarriers(
    csvContent: string
): Promise<{ data: ImportResult | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { data: null, error: "Unauthorized" };
        }

        const rows = parseCSV(csvContent);
        const result: ImportResult = {
            success: true,
            total_rows: rows.length,
            successful_imports: 0,
            failed_imports: 0,
            errors: [],
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            // Validate row
            const validationError = validatePartnerRow(row, rowNumber);
            if (validationError) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: validationError,
                });
                continue;
            }

            // Find user by email
            const { data: userData, error: userError } = await findUserByEmail(row.email);
            if (userError || !userData) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: "User not found in system",
                });
                continue;
            }

            // Check if already in network
            const { data: existing } = await supabase
                .from("broker_carrier_network")
                .select("id")
                .eq("broker_user_id", user.id)
                .eq("carrier_user_id", userData.id)
                .single();

            if (existing) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: "Already in network",
                });
                continue;
            }

            // Parse service areas
            const serviceAreas = row.service_areas
                ? row.service_areas.split(";").map(s => s.trim()).filter(s => s)
                : [];

            // Import carrier
            const { error: insertError } = await supabase
                .from("broker_carrier_network")
                .insert({
                    broker_user_id: user.id,
                    carrier_user_id: userData.id,
                    service_areas: serviceAreas,
                    notes: row.notes || "",
                    relationship_status: "active",
                });

            if (insertError) {
                result.failed_imports++;
                result.errors.push({
                    row: rowNumber,
                    email: row.email,
                    error: insertError.message,
                });
            } else {
                result.successful_imports++;
            }
        }

        result.success = result.failed_imports === 0;

        return { data: result, error: null };
    } catch (error: any) {
        console.error("Error in bulkImportCarriers:", error);
        return { data: null, error: error.message };
    }
}
