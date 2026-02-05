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
