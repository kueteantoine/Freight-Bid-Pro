"use client";

import React, { useState, useEffect } from 'react';
import { ConversationList } from '@/components/shipper/communication/ConversationList';
import { ChatWindow } from '@/components/shipper/communication/ChatWindow';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { MessageSquare, Inbox } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ShipperMessagesPage() {
    const t = useTranslations("shipperSubPages");
    const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            }
        };
        getUser();
    }, []);

    if (!currentUserId) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-160px)] -mt-2 -mx-6 md:-mx-8 border-t bg-card/30 backdrop-blur-sm overflow-hidden">
            {/* Sidebar - Conversation List */}
            <div className="w-80 flex-shrink-0 border-r bg-card/10 shadow-sm">
                <ConversationList
                    onSelectConversation={setSelectedShipmentId}
                    selectedShipmentId={selectedShipmentId || undefined}
                />
            </div>

            {/* Main Content - Chat Window */}
            <div className="flex-1 flex flex-col bg-slate-50/30">
                {selectedShipmentId ? (
                    <div className="p-4 h-full">
                        <ChatWindow
                            shipmentId={selectedShipmentId}
                            currentUserId={currentUserId}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground animate-in fade-in zoom-in duration-300">
                        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 shadow-sm border border-primary/10">
                            <Inbox className="h-10 w-10 text-primary opacity-40" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t("yourInbox")}</h3>
                        <p className="max-w-xs text-sm font-medium leading-relaxed opacity-60">
                            {t("yourInboxDesc")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
