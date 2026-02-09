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
 * Fetches place predictions from Google Places Autocomplete API.
 */
export async function getPlacePredictions(query: string): Promise<GooglePlace[]> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn("Google Maps API key is missing, using mock predictions.");
        return [
            { description: `${query}, Douala, Littoral, Cameroon`, place_id: "douala_1" },
            { description: `${query}, Yaoundé, Centre, Cameroon`, place_id: "yaounde_1" },
            { description: `${query}, Bafoussam, West, Cameroon`, place_id: "bafoussam_1" },
        ];
    }

    if (!query || query.length < 3) return [];

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:cm&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK") {
            return data.predictions.map((p: any) => ({
                description: p.description,
                place_id: p.place_id
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching Google Place predictions:", error);
        return [];
    }
}

/**
 * Fetches coordinates for a given place ID using Google Geocoding API.
 */
export async function getCoordinates(placeId: string): Promise<{ lat: number; lng: number }> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn("Google Maps API key is missing, using mock coordinates.");
        return {
            lat: 4.0511 + (Math.random() - 0.5) * 0.1,
            lng: 9.7679 + (Math.random() - 0.5) * 0.1,
        };
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" && data.results[0]) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng
            };
        }
        throw new Error("Geocoding failed");
    } catch (error) {
        console.error("Error fetching Google Geocoding:", error);
        throw error;
    }
}

/**
 * Fetches address for given coordinates using Google Reverse Geocoding API.
 */
export async function getReverseGeocoding(lat: number, lng: number): Promise<string | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.warn("Google Maps API key is missing");
        return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK" && data.results[0]) {
            return data.results[0].formatted_address;
        }
        return null;
    } catch (error) {
        console.error("Error fetching Google Reverse Geocoding:", error);
        return null;
    }
}
