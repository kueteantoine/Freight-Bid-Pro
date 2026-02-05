'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Headset, User, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface SupportQuickDialProps {
    shipperPhone?: string;
    transporterPhone?: string;
    supportPhone?: string;
}

export function SupportQuickDial({ shipperPhone, transporterPhone, supportPhone = "+237000000000" }: SupportQuickDialProps) {
    const handleCall = (phone?: string) => {
        if (phone) {
            window.location.href = `tel:${phone}`;
        } else {
            alert('Phone number not available');
        }
    };

    return (
        <div className="grid grid-cols-3 gap-3">
            <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-24 bg-card hover:bg-muted border-2 transition-all active:scale-95"
                onClick={() => handleCall(shipperPhone)}
            >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-tighter">Shipper</span>
            </Button>

            <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-24 bg-card hover:bg-muted border-2 transition-all active:scale-95"
                onClick={() => handleCall(transporterPhone)}
            >
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-tighter">Dispatch</span>
            </Button>

            <Button
                variant="outline"
                className="flex flex-col items-center gap-2 h-24 bg-card hover:bg-muted border-2 transition-all active:scale-95"
                onClick={() => handleCall(supportPhone)}
            >
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <Headset className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-xs font-bold uppercase tracking-tighter">Support</span>
            </Button>
        </div>
    );
}
