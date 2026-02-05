'use client';

import React, { useEffect, useState, useRef } from 'react';
import { messageService } from '@/lib/services/message-service';
import { Message, Profile } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Phone, Volume2, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { QuickTemplates } from './QuickTemplates';
import { VoiceRecorder } from './VoiceRecorder';

interface SimplifiedChatProps {
    shipmentId: string;
    currentUserId: string;
    recipientName?: string;
    recipientAvatar?: string;
}

export function SimplifiedChat({ shipmentId, currentUserId, recipientName, recipientAvatar }: SimplifiedChatProps) {
    const [messages, setMessages] = useState<(Message & { sender_profile?: Profile })[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showVoice, setShowVoice] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const data = await messageService.fetchMessages({ shipment_id: shipmentId });
                setMessages(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading messages:', error);
                setIsLoading(false);
            }
        };

        loadMessages();

        const subscription = messageService.subscribeToMessages(shipmentId, (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [shipmentId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent, content?: string, type: any = 'text') => {
        e?.preventDefault();
        const textToSend = content || newMessage;
        if (!textToSend.trim() || isSending) return;

        setIsSending(true);
        try {
            await messageService.sendMessage({
                conversation_type: 'shipment_chat',
                related_shipment_id: shipmentId,
                sender_user_id: currentUserId,
                message_content: textToSend.trim(),
                message_type: type,
            });
            setNewMessage('');
            setShowVoice(false);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleSendVoice = async (blob: Blob) => {
        try {
            const url = await messageService.uploadAudio(blob, currentUserId);
            await messageService.sendMessage({
                conversation_type: 'shipment_chat',
                related_shipment_id: shipmentId,
                sender_user_id: currentUserId,
                message_content: 'Voice Message',
                message_type: 'audio',
                attachment_url: url
            });
            setShowVoice(false);
        } catch (error) {
            console.error('Error sending voice message:', error);
            alert('Failed to send voice message');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                        <AvatarImage src={recipientAvatar} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">
                            {recipientName?.[0] || 'R'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-bold text-base leading-none mb-1">{recipientName || 'Recipient'}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Shipment #{shipmentId.slice(0, 6)}</p>
                    </div>
                </div>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-2" onClick={() => window.location.href = 'tel:+237000000000'}>
                    <Phone className="h-5 w-5 text-green-600" />
                </Button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                <div className="pb-4">
                    <QuickTemplates onSelect={(text) => handleSendMessage(undefined, text)} />
                </div>

                <div className="space-y-6">
                    {messages.map((msg) => {
                        const isMe = msg.sender_user_id === currentUserId;
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                                    isMe ? "ml-auto" : "mr-auto"
                                )}
                            >
                                <div
                                    className={cn(
                                        "px-5 py-3 rounded-2xl text-base shadow-sm",
                                        isMe
                                            ? "bg-slate-900 text-white rounded-br-none"
                                            : "bg-white border-2 text-slate-900 rounded-bl-none"
                                    )}
                                >
                                    {msg.message_type === 'audio' ? (
                                        <div className="flex items-center gap-3 min-w-[200px]">
                                            <div className={cn("p-2 rounded-full", isMe ? "bg-slate-800" : "bg-slate-100")}>
                                                <Volume2 className={cn("h-5 w-5", isMe ? "text-indigo-400" : "text-indigo-600")} />
                                            </div>
                                            <audio controls className="h-8 max-w-[150px] custom-audio" src={msg.attachment_url || ''} />
                                        </div>
                                    ) : (
                                        <p className="leading-relaxed">{msg.message_content}</p>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 px-1",
                                    isMe && "text-right"
                                )}>
                                    {format(new Date(msg.sent_at), 'HH:mm')}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer / Input */}
            <div className="p-4 border-t bg-background/95 backdrop-blur sticky bottom-0">
                {showVoice ? (
                    <div className="animate-in slide-in-from-bottom-4 duration-300">
                        <VoiceRecorder onSend={handleSendVoice} />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-xs font-bold text-muted-foreground uppercase"
                            onClick={() => setShowVoice(false)}
                        >
                            Cancel Voice
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            className="shrink-0 h-14 w-14 rounded-2xl border-2 hover:bg-muted"
                            onClick={() => setShowVoice(true)}
                        >
                            <Mic className="h-6 w-6 text-primary" />
                        </Button>
                        <Input
                            placeholder="Type message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 h-14 px-5 rounded-2xl border-2 text-base bg-muted/20"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!newMessage.trim() || isSending}
                            className="shrink-0 h-14 w-14 rounded-2xl shadow-lg bg-slate-900 hover:bg-slate-800"
                        >
                            {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                        </Button>
                    </form>
                )}
            </div>

            <style jsx global>{`
                .custom-audio::-webkit-media-controls-enclosure {
                    background-color: transparent !important;
                }
                .custom-audio::-webkit-media-controls-panel {
                    filter: invert(1) brightness(2);
                }
            `}</style>
        </div>
    );
}
