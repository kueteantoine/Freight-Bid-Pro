"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getPlacePredictions, GooglePlace } from "@/lib/google-maps";
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
            <div className="relative">
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

            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-200">
                    {predictions.map((place) => (
                        <button
                            key={place.place_id}
                            type="button"
                            className="w-full text-left px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground flex items-start gap-3 transition-colors border-b last:border-0"
                            onClick={() => {
                                onSelect(place);
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
