"use client";

import React, { useState } from "react";
import { SupportTicketDashboard } from "@/components/admin/support/SupportTicketDashboard";
import { TicketDetailView } from "@/components/admin/support/TicketDetailView";
import type { SupportTicket } from "@/app/actions/support-ticket-actions";

export default function SupportTicketsPage() {
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    return (
        <div className="h-screen flex bg-slate-50">
            {/* Sidebar */}
            <aside className="w-96 bg-white border-r border-slate-100">
                <SupportTicketDashboard
                    onSelectTicket={setSelectedTicket}
                    selectedTicketId={selectedTicket?.id}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {selectedTicket ? (
                    <TicketDetailView ticketId={selectedTicket.id} />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="h-10 w-10 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                No Ticket Selected
                            </h3>
                            <p className="text-sm text-slate-500">
                                Select a support ticket from the list to view details
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
