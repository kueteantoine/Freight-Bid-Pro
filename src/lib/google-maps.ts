export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export interface GooglePlace {
    description: string;
    place_id: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

/**
 * Fetches distance and duration between two points using Google Distance Matrix API.
 */
export async function getDistanceMatrix(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
): Promise<{ distance_text: string; distance_value: number; duration_text: string; duration_value: number } | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn("Google Maps API key is missing");
        return null;
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" && data.rows[0].elements[0].status === "OK") {
            const element = data.rows[0].elements[0];
            return {
                distance_text: element.distance.text,
                distance_value: element.distance.value, // in meters
                duration_text: element.duration.text,
                duration_value: element.duration.value // in seconds
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching Google Distance Matrix:", error);
        return null;
    }
}

/**
 * Placeholder for location autocomplete.
 * In a real implementation, this would call the Google Places API.
 */
export async function getPlacePredictions(query: string): Promise<GooglePlace[]> {
    if (!query || query.length < 3) return [];

    // Mock predictions for demonstration
    const mockPlaces: GooglePlace[] = [
        { description: `${query}, Douala, Littoral, Cameroon`, place_id: "douala_1" },
        { description: `${query}, Yaoundé, Centre, Cameroon`, place_id: "yaounde_1" },
        { description: `${query}, Bafoussam, West, Cameroon`, place_id: "bafoussam_1" },
    ];

    return mockPlaces;
}

/**
 * Placeholder for geocoding.
 * In a real implementation, this would call the Google Geocoding API.
 */
export async function getCoordinates(placeId: string): Promise<{ lat: number; lng: number }> {
    // Mock coordinates for demonstration
    return {
        lat: 4.0511 + (Math.random() - 0.5) * 0.1,
        lng: 9.7679 + (Math.random() - 0.5) * 0.1,
    };
}
