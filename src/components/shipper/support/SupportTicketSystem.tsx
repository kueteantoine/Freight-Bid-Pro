"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
    FileText,
    ChevronRight,
    Search
} from "lucide-react";
import { supportService, SupportTicket, TicketPriority } from "@/lib/services/support-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const SupportTicketSystem = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Form state
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("");
    const [priority, setPriority] = useState<TicketPriority>("medium");
    const [description, setDescription] = useState("");

    const supabase = createSupabaseBrowserClient();

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const data = await supportService.fetchMyTickets();
            setTickets(data);
        } catch (error) {
            console.error("Failed to load tickets:", error);
            toast.error("Failed to load support tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            await supportService.createTicket({
                subject,
                description,
                category,
                priority,
                user_id: user.id
            });

            toast.success("Support ticket created successfully!");
            setIsCreateModalOpen(false);
            resetForm();
            loadTickets();
        } catch (error: any) {
            toast.error(error.message || "Failed to create ticket");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSubject("");
        setCategory("");
        setPriority("medium");
        setDescription("");
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "open": return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case "in_progress": return <Clock className="w-4 h-4 text-blue-500" />;
            case "resolved": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "closed": return <X className="w-4 h-4 text-slate-400" />;
            default: return null;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "low": return <Badge variant="secondary" className="bg-slate-100 text-slate-600">Low</Badge>;
            case "medium": return <Badge variant="secondary" className="bg-blue-50 text-blue-600">Medium</Badge>;
            case "high": return <Badge variant="secondary" className="bg-amber-50 text-amber-600">High</Badge>;
            case "urgent": return <Badge variant="secondary" className="bg-red-50 text-red-600">Urgent</Badge>;
            default: return null;
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.ticket_number.toString().includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        Support Tickets
                    </h2>
                    <p className="text-sm text-slate-500">Track and manage your help requests</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Input
                            placeholder="Filter tickets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-indigo-200 shadow-lg">
                                <Plus className="w-4 h-4" />
                                New Ticket
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Create Support Ticket</DialogTitle>
                                    <DialogDescription>
                                        Please provide details about your issue. We'll get back to you as soon as possible.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Brief summary of the issue"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="category">Category</Label>
                                            <Select value={category} onValueChange={setCategory} required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Booking">Booking</SelectItem>
                                                    <SelectItem value="Bidding">Bidding</SelectItem>
                                                    <SelectItem value="Payments">Payments</SelectItem>
                                                    <SelectItem value="Tracking">Tracking</SelectItem>
                                                    <SelectItem value="Account">Account</SelectItem>
                                                    <SelectItem value="Technical">Technical</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="priority">Priority</Label>
                                            <Select
                                                value={priority}
                                                onValueChange={(v) => setPriority(v as TicketPriority)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Provide as much detail as possible..."
                                            rows={5}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit Ticket"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : filteredTickets.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-16 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-medium">No tickets found</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                {searchQuery
                                    ? "No tickets match your search criteria. Try a different query."
                                    : "You haven't created any support tickets yet. Click 'New Ticket' to get started."}
                            </p>
                        </div>
                        {!searchQuery && (
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                                Create My First Ticket
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredTickets.map((ticket) => (
                        <Card key={ticket.id} className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer border-slate-200">
                            <div className="flex items-center p-4">
                                <div className={`w-1 h-12 rounded-full mr-4 ${ticket.status === 'open' ? 'bg-amber-400' :
                                        ticket.status === 'in_progress' ? 'bg-blue-400' :
                                            ticket.status === 'resolved' ? 'bg-green-400' :
                                                'bg-slate-300'
                                    }`} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-slate-400 uppercase">#{ticket.ticket_number}</span>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-semibold text-slate-900 truncate pr-4 group-hover:text-primary transition-colors">
                                        {ticket.subject}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
                                            {getStatusIcon(ticket.status)}
                                            <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                                        </div>
                                        {getPriorityBadge(ticket.priority)}
                                        <Badge variant="outline" className="text-[10px] font-normal border-slate-200">
                                            {ticket.category}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 px-4">
                                    {ticket.attachments_json?.length > 0 && (
                                        <div className="hidden md:flex items-center gap-1 text-slate-400">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-xs">{ticket.attachments_json.length}</span>
                                        </div>
                                    )}
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
