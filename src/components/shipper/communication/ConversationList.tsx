'use client';

import React, { useEffect, useState } from 'react';
import { messageService } from '@/lib/services/message-service';
import { Shipment } from '@/lib/types/database';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationListProps {
    onSelectConversation: (shipmentId: string) => void;
    selectedShipmentId?: string;
}

export function ConversationList({ onSelectConversation, selectedShipmentId }: ConversationListProps) {
    const [conversations, setConversations] = useState<Shipment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const data = await messageService.fetchConversations();
                setConversations(data as Shipment[]);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading conversations:', error);
                setIsLoading(false);
            }
        };

        loadConversations();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No active conversations found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border-r">
            <div className="p-4 border-b">
                <h2 className="font-semibold">Messages</h2>
            </div>
            <ScrollArea className="flex-1">
                <div className="divide-y">
                    {conversations.map((shipment) => (
                        <button
                            key={shipment.id}
                            onClick={() => onSelectConversation(shipment.id)}
                            className={cn(
                                "w-full p-4 flex gap-3 text-left transition-colors hover:bg-muted/50",
                                selectedShipmentId === shipment.id && "bg-muted shadow-inner"
                            )}
                        >
                            <div className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl border bg-background shadow-sm">
                                <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-sm truncate uppercase tracking-tight">#{shipment.shipment_number.slice(-8)}</span>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest",
                                        shipment.status === 'in_transit' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                            shipment.status === 'delivered' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                "bg-slate-50 text-slate-500 border border-slate-100"
                                    )}>
                                        {shipment.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate font-medium">
                                    {shipment.pickup_location} → {shipment.delivery_location}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
