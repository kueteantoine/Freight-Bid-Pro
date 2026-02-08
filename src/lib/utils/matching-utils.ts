/**
 * Matching Utilities for Freight Bid Pro
 * Used to implement tiered matching strategy and geographic calculations
 */

/**
 * Normalizes a string for matching purposes as per strategic recommendations.
 */
export function normalizeTypeString(str: string): string {
    if (!str) return "";

    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except hyphens
        .replace(/\s+/g, " "); // Collapse whitespace
}

/**
 * Simple Levenshtein distance calculation for fuzzy matching.
 */
export function getLevenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculates similarity score (0 to 1) between two strings.
 */
export function getStringSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;

    if (longer.length === 0) return 1.0;

    const distance = getLevenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

/**
 * Haversine formula to calculate distance between two points on Earth in km.
 */
export function calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Tiered matching function for types.
 * Returns a match tier (1-4) and a confidence score.
 */
export function getTieredMatch(
    inputValue: string,
    targetValue: string
): { tier: number; score: number } {
    const input = inputValue.trim();
    const target = targetValue.trim();

    // Tier 1: Exact Match
    if (input === target) return { tier: 1, score: 1.0 };

    const normInput = normalizeTypeString(input);
    const normTarget = normalizeTypeString(target);

    // Tier 2: Normalized Match
    if (normInput === normTarget) return { tier: 2, score: 0.95 };

    // Tier 3: Fuzzy Match
    const similarity = getStringSimilarity(normInput, normTarget);
    if (similarity >= 0.85) return { tier: 3, score: similarity };

    // Tier 4: No match or placeholder for Semantic Match
    return { tier: 5, score: 0 };
}
