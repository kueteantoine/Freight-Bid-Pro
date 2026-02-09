"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, Map as MapIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPicker } from "@/components/maps/MapPicker";
import { getPlacePredictions, GooglePlace, getReverseGeocoding } from "@/lib/google-maps";
import { cn } from "@/lib/utils";

interface LocationAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (place: GooglePlace) => void;
    placeholder?: string;
    className?: string;
    icon?: React.ReactNode;
}

export function LocationAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = "Enter location...",
    className,
    icon,
}: LocationAutocompleteProps) {
    const [predictions, setPredictions] = useState<GooglePlace[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchPredictions = async () => {
            if (value.length < 3) {
                setPredictions([]);
                return;
            }

            // Don't fetch if value was set via map picker (heuristic: long description with commas usually)
            // or if we just selected something. 
            // For now, let's just debounce.

            setIsLoading(true);
            try {
                const results = await getPlacePredictions(value);
                setPredictions(results);
                setShowDropdown(results.length > 0);
            } catch (err) {
                console.error("Autocomplete error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        const debounce = setTimeout(fetchPredictions, 300);
        return () => clearTimeout(debounce);
    }, [value]);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            icon || <MapPin className="h-4 w-4 text-primary" />
                        )}
                    </div>
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setShowDropdown(predictions.length > 0)}
                        placeholder={placeholder}
                        className={cn("pl-10", className)}
                    />
                </div>

                <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0 h-12 w-12" title="Pin on Map">
                            <MapIcon className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none bg-transparent shadow-none">
                        <div className="bg-background rounded-2xl overflow-hidden shadow-2xl">
                            <DialogHeader className="p-4 border-b">
                                <DialogTitle>Select Location on Map</DialogTitle>
                            </DialogHeader>
                            <div className="p-4">
                                <MapPicker
                                    onConfirm={(coords, address) => {
                                        onSelect({
                                            description: address || `${coords.lat}, ${coords.lng}`,
                                            place_id: "map-selection",
                                            coordinates: coords
                                        });
                                        onChange(address || `${coords.lat}, ${coords.lng}`);
                                        setIsMapOpen(false);
                                    }}
                                />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                    {predictions.map((place) => (
                        <button
                            key={place.place_id}
                            type="button"
                            className="w-full text-left px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground flex items-start gap-3 transition-colors border-b last:border-0"
                            onClick={() => {
                                onSelect(place);
                                onChange(place.description);
                                setShowDropdown(false);
                            }}
                        >
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <span>{place.description}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
