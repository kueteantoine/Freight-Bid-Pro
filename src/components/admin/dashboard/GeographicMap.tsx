'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';

interface GeographicMapProps {
    data: {
        heatmap_data: Array<{ lat: number; lng: number; weight: number }>;
    };
}

export function GeographicMap({ data }: GeographicMapProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        if (!mapContainer.current) return;

        if (!MAPBOX_ACCESS_TOKEN) {
            setError("Mapbox access token is missing.");
            return;
        }

        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [12.3547, 7.3697], // Center of Cameroon
                zoom: 5
            });

            map.current.on('load', () => {
                if (!map.current) return;

                // Convert data to GeoJSON
                const geoJsonData: GeoJSON.FeatureCollection = {
                    type: 'FeatureCollection',
                    features: data.heatmap_data.map(point => ({
                        type: 'Feature',
                        properties: {
                            mag: point.weight
                        },
                        geometry: {
                            type: 'Point',
                            coordinates: [point.lng, point.lat]
                        }
                    }))
                };

                map.current.addSource('shipments', {
                    type: 'geojson',
                    data: geoJsonData
                });

                map.current.addLayer({
                    id: 'shipments-heat',
                    type: 'heatmap',
                    source: 'shipments',
                    maxzoom: 9,
                    paint: {
                        // Increase the heatmap weight based on frequency and property magnitude
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            0,
                            0,
                            6,
                            1
                        ],
                        // Increase the heatmap color weight weight by zoom level
                        // heatmap-intensity is a multiplier on top of heatmap-weight
                        'heatmap-intensity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0,
                            1,
                            9,
                            3
                        ],
                        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
                        // Begin color ramp at 0-stop with a 0-transparancy color
                        // to create a blur-like effect.
                        'heatmap-color': [
                            'interpolate',
                            ['linear'],
                            ['heatmap-density'],
                            0,
                            'rgba(33,102,172,0)',
                            0.2,
                            'rgb(103,169,207)',
                            0.4,
                            'rgb(209,229,240)',
                            0.6,
                            'rgb(253,219,199)',
                            0.8,
                            'rgb(239,138,98)',
                            1,
                            'rgb(178,24,43)'
                        ],
                        // Adjust the heatmap radius by zoom level
                        'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0,
                            2,
                            9,
                            20
                        ],
                        // Transition from heatmap to circle layer by zoom level
                        'heatmap-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            7,
                            1,
                            9,
                            0
                        ]
                    }
                });

                map.current.addLayer({
                    id: 'shipments-point',
                    type: 'circle',
                    source: 'shipments',
                    minzoom: 7,
                    paint: {
                        // Size circle radius by earthquake magnitude and zoom level
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            7,
                            ['interpolate', ['linear'], ['get', 'mag'], 1, 1, 6, 4],
                            16,
                            ['interpolate', ['linear'], ['get', 'mag'], 1, 5, 6, 50]
                        ],
                        // Color circle by earthquake magnitude
                        'circle-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'mag'],
                            1,
                            'rgba(33,102,172,0)',
                            2,
                            'rgb(103,169,207)',
                            3,
                            'rgb(209,229,240)',
                            4,
                            'rgb(253,219,199)',
                            5,
                            'rgb(239,138,98)',
                            6,
                            'rgb(178,24,43)'
                        ],
                        'circle-stroke-color': 'white',
                        'circle-stroke-width': 1,
                        'circle-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            7,
                            0,
                            8,
                            1
                        ]
                    }
                });
            });
        } catch (e: any) {
            console.error("Map initialization error:", e);
            setError(e.message || "Failed to load map.");
        }
    }, [data]);

    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
                <CardTitle>Geographic Shipments</CardTitle>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="h-[350px] w-full flex items-center justify-center bg-muted text-destructive">
                        {error}
                    </div>
                ) : (
                    <div ref={mapContainer} className="h-[350px] w-full rounded-md" />
                )}
            </CardContent>
        </Card>
    );
}
