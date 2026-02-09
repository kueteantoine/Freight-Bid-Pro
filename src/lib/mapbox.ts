/**
 * Mapbox Utility
 * 
 * NOTE: Requires NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local
 */

export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

/**
 * Haversine formula to calculate the distance between two points in kilometers.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Checks if a point is within a given radius (in meters) of a center coordinate.
 */
export function isWithinRadius(
    pointLat: number,
    pointLon: number,
    centerLat: number,
    centerLon: number,
    radiusInMeters: number
): boolean {
    const distanceKm = calculateDistance(pointLat, pointLon, centerLat, centerLon);
    return distanceKm * 1000 <= radiusInMeters;
}

/**
 * Fetches directions between two points using Mapbox Directions API.
 */
export async function getMapboxDirections(
    start: [number, number], // [lng, lat]
    end: [number, number],   // [lng, lat]
    profile: "driving-traffic" | "driving" = "driving-traffic"
) {
    if (!MAPBOX_ACCESS_TOKEN) {
        console.warn("Mapbox access token is missing");
        return null;
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=true&geometries=geojson&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching Mapbox directions:", error);
        return null;
    }
}

/**
 * Fetches place suggestions from Mapbox Search API (v6).
 */
export async function getMapboxPlacePredictions(query: string): Promise<any[]> {
    if (!MAPBOX_ACCESS_TOKEN) return [];
    if (!query || query.length < 3) return [];

    const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&language=fr,en&country=cm&access_token=${MAPBOX_ACCESS_TOKEN}&session_token=session-123`; // Hardcoded session token for simplicity

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.suggestions || [];
    } catch (error) {
        console.error("Mapbox Autocomplete error:", error);
        return [];
    }
}

/**
 * Retrives coordinates for a Mapbox suggestion or query.
 */
export async function getMapboxCoordinates(query: string): Promise<{ lat: number; lng: number } | null> {
    if (!MAPBOX_ACCESS_TOKEN) return null;

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=cm&limit=1&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features[0]) {
            const [lng, lat] = data.features[0].center;
            return { lat, lng };
        }
        return null;
    } catch (error) {
        console.error("Mapbox Geocoding error:", error);
        return null;
    }
}

/**
 * Reverse geocodes coordinates to a human-readable address using Mapbox.
 */
export async function getMapboxReverseGeocoding(lat: number, lng: number): Promise<string | null> {
    if (!MAPBOX_ACCESS_TOKEN) return null;

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?limit=1&access_token=${MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features[0]) {
            return data.features[0].place_name;
        }
        return null;
    } catch (error) {
        console.error("Mapbox Reverse Geocoding error:", error);
        return null;
    }
}
