'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, AlertTriangle, Truck, MapPin } from 'lucide-react';

interface QuickTemplatesProps {
    onSelect: (text: string) => void;
}

const TEMPLATES = [
    { label: "Arrived", text: "I have arrived at the pickup location.", icon: MapPin, color: "text-blue-500" },
    { label: "Loaded", text: "The cargo is loaded and I'm ready to move.", icon: Truck, color: "text-green-500" },
    { label: "Traffic", text: "Traffic delay, will arrive in 20-30 minutes.", icon: Clock, color: "text-yellow-500" },
    { label: "Delivered", text: "Shipment delivered successfully.", icon: CheckCircle2, color: "text-indigo-500" },
    { label: "Issue", text: "I've encountered an issue. Please contact me.", icon: AlertTriangle, color: "text-red-500" },
];

export function QuickTemplates({ onSelect }: QuickTemplatesProps) {
    return (
        <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border border-dashed">
            {TEMPLATES.map((tpl) => (
                <Button
                    key={tpl.label}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 rounded-full bg-background hover:bg-muted h-9 px-4 text-xs font-medium"
                    onClick={() => onSelect(tpl.text)}
                >
                    <tpl.icon className={`h-3.5 w-3.5 ${tpl.color}`} />
                    {tpl.label}
                </Button>
            ))}
        </div>
    );
}
