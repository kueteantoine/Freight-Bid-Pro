"use client";

import React, { useState } from "react";
import { DisputeDashboard } from "@/components/admin/disputes/DisputeDashboard";
import { DisputeDetailView } from "@/components/admin/disputes/DisputeDetailView";
import type { Dispute } from "@/app/actions/dispute-actions";

export default function DisputeCenterPage() {
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

    return (
        <div className="h-screen flex bg-slate-50">
            {/* Sidebar */}
            <aside className="w-96 bg-white border-r border-slate-100">
                <DisputeDashboard
                    onSelectDispute={setSelectedDispute}
                    selectedDisputeId={selectedDispute?.id}
                />
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {selectedDispute ? (
                    <DisputeDetailView disputeId={selectedDispute.id} />
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
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                No Dispute Selected
                            </h3>
                            <p className="text-sm text-slate-500">
                                Select a dispute from the list to view details
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}