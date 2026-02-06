/**
 * CSV Import Utilities
 * Client-side helper functions for CSV processing
 */

export interface CSVPartnerRow {
    email: string;
    company_name?: string;
    commission_rate?: string;
    service_areas?: string;
    notes?: string;
}

/**
 * Parse CSV content
 */
export function parseCSV(csvContent: string): CSVPartnerRow[] {
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const rows: CSVPartnerRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        const row: any = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || "";
        });

        rows.push(row);
    }

    return rows;
}

/**
 * Validate partner data
 */
export function validatePartnerRow(row: CSVPartnerRow, rowNumber: number): string | null {
    if (!row.email || !row.email.includes("@")) {
        return `Invalid email address`;
    }

    if (row.commission_rate) {
        const rate = parseFloat(row.commission_rate);
        if (isNaN(rate) || rate < 0 || rate > 100) {
            return `Invalid commission rate (must be 0-100)`;
        }
    }

    return null;
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(type: "shipper" | "carrier"): string {
    if (type === "shipper") {
        return `email,company_name,commission_rate,notes
user@example.com,Company Inc,10.5,Preferred partner
another@example.com,Another Co,12.0,New client`;
    } else {
        return `email,company_name,service_areas,notes
carrier@example.com,Transport Co,Douala;Yaoundé,Reliable carrier
fleet@example.com,Fleet Services,Bafoussam;Garoua,Large fleet`;
    }
}
