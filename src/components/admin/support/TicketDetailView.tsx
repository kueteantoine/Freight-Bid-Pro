"use client";

import React, { useState, useEffect } from "react";
import { Ticket, Send, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    getTicketById,
    type SupportTicketDetails,
    updateTicketStatus,
    addTicketResponse,
    closeTicket,
} from "@/app/actions/support-ticket-actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TicketDetailViewProps {
    ticketId: string;
}

export function TicketDetailView({ ticketId }: TicketDetailViewProps) {
    const [ticket, setTicket] = useState<SupportTicketDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [response, setResponse] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadTicket();
    }, [ticketId]);

    const loadTicket = async () => {
        setLoading(true);
        const { data } = await getTicketById(ticketId);
        if (data) setTicket(data);
        setLoading(false);
    };

    const handleStatusChange = async (newStatus: any) => {
        if (!ticket) return;
        await updateTicketStatus(ticket.id, newStatus);
        loadTicket();
    };

    const handleSendResponse = async () => {
        if (!response.trim() || !ticket) return;
        setSending(true);
        const { success } = await addTicketResponse(ticket.id, response);
        if (success) {
            setResponse("");
            loadTicket();
        }
        setSending(false);
    };

    const handleCloseTicket = async () => {
        if (!ticket) return;
        await closeTicket(ticket.id, "Ticket resolved and closed");
        loadTicket();
    };

    if (loading || !ticket) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        );
    }

    const responses = (ticket.attachments_json as any[])?.filter(
        (item) => item.type === "response"
    ) || [];

    return (
        <div className="flex flex-col h-full bg-slate-50/30">
            <header className="p-8 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <Ticket className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                Ticket #{ticket.ticket_number}
                            </h3>
                            <p className="text-sm text-slate-500">{ticket.user_email}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Select value={ticket.status} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-40 rounded-xl h-11">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleCloseTicket}
                            className="rounded-xl"
                            variant="outline"
                            disabled={ticket.status === "closed"}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Close Ticket
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col">
                <div className="p-6 bg-white border-b border-slate-100">
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{ticket.subject}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{ticket.description}</p>
                    <div className="flex gap-2 mt-4">
                        <Badge variant="outline">{ticket.category}</Badge>
                        <Badge variant="outline">{ticket.priority}</Badge>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-8">
                    <div className="space-y-6">
                        {responses.map((resp: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-slate-900">Admin Response</span>
                                    <span className="text-xs text-slate-400">
                                        {new Date(resp.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">{resp.text}</p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <footer className="p-6 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                        <Textarea
                            placeholder="Type your response..."
                            className="min-h-[80px] bg-slate-50 rounded-2xl resize-none"
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                        />
                        <Button
                            className="h-[80px] px-6 bg-primary rounded-xl"
                            onClick={handleSendResponse}
                            disabled={sending || !response.trim()}
                        >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                        </Button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
