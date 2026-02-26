'use client';

import React, { useEffect, useState } from 'react';
import { messageService } from '@/lib/services/message-service';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, ChevronRight, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { SupportQuickDial } from '@/components/driver/communication/SupportQuickDial';

export default function MessagesPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadConversations = async () => {
            try {
                const data = await messageService.fetchConversations();
                setConversations(data);
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold mb-1">Communication</h1>
                <p className="text-sm text-muted-foreground">Support and shipment contacts</p>
            </div>

            {/* Support Dial */}
            <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" /> One-Tap Call
                </h2>
                <SupportQuickDial />
            </section>

            {/* Active Chats */}
            <section className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Recent Messages
                </h2>

                {conversations.length === 0 ? (
                    <Card className="border-dashed bg-muted/20">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No active conversations found</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {conversations.map((shipment) => (
                            <Link key={shipment.id} href={`/driver/messages/${shipment.id}`}>
                                <Card className="hover:bg-muted/50 transition-colors border-2 active:bg-muted">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                                <MessageSquare className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold">#{shipment.shipment_number}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                                                    {shipment.pickup_location} → {shipment.delivery_location}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
