'use client';

import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAvailableLoads, getAvailableCarriers, createManualMatch, type AvailableLoad, type AvailableCarrier } from '@/actions/broker-load-matching-actions';
import AvailableLoadsPanel from './AvailableLoadsPanel';
import AvailableCarriersPanel from './AvailableCarriersPanel';
import MatchingSuggestionsPanel from './MatchingSuggestionsPanel';
import MatchingHistoryView from './MatchingHistoryView';
import { toast } from 'sonner';

interface LoadMatchingDashboardProps {
    brokerId: string;
}

export default function LoadMatchingDashboard({ brokerId }: LoadMatchingDashboardProps) {
    const [loads, setLoads] = useState<AvailableLoad[]>([]);
    const [carriers, setCarriers] = useState<AvailableCarrier[]>([]);
    const [selectedLoad, setSelectedLoad] = useState<AvailableLoad | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        loadData();
    }, [brokerId]);

    async function loadData() {
        setIsLoading(true);
        try {
            const [loadsResult, carriersResult] = await Promise.all([
                getAvailableLoads(brokerId),
                getAvailableCarriers(brokerId),
            ]);

            if (loadsResult.data) setLoads(loadsResult.data);
            if (carriersResult.data) setCarriers(carriersResult.data);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load matching data');
        } finally {
            setIsLoading(false);
        }
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const loadId = active.id as string;
        const carrierId = over.id as string;

        const load = loads.find(l => l.id === loadId);
        const carrier = carriers.find(c => c.carrier_user_id === carrierId);

        if (!load || !carrier) return;

        // Confirm match
        const confirmed = window.confirm(
            `Match "${load.shipment_number}" to "${carrier.carrier_name}"?\n\n` +
            `Load: ${load.weight_kg}kg ${load.freight_type}\n` +
            `Route: ${load.pickup_location} → ${load.delivery_location}\n\n` +
            `Carrier: ${carrier.carrier_name}\n` +
            `Available Capacity: ${carrier.available_weight_kg}kg\n` +
            `Rating: ${carrier.reliability_rating.toFixed(1)}/5.0`
        );

        if (!confirmed) return;

        // Create the match
        const result = await createManualMatch(brokerId, loadId, carrierId);

        if (result.error) {
            toast.error(`Failed to create match: ${result.error}`);
        } else {
            toast.success(`Successfully matched ${load.shipment_number} to ${carrier.carrier_name}`);
            // Reload data
            loadData();
        }
    }

    const draggedLoad = loads.find(l => l.id === activeId);

    return (
        <div className="space-y-6">
            <Tabs defaultValue="matching" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                    <TabsTrigger value="matching">Load Matching</TabsTrigger>
                    <TabsTrigger value="history">History & Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="matching" className="mt-6">
                    <DndContext
                        sensors={sensors}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Available Loads Panel */}
                            <div className="lg:col-span-1">
                                <AvailableLoadsPanel
                                    loads={loads}
                                    isLoading={isLoading}
                                    onLoadSelect={setSelectedLoad}
                                    selectedLoadId={selectedLoad?.id}
                                />
                            </div>

                            {/* Available Carriers Panel */}
                            <div className="lg:col-span-1">
                                <AvailableCarriersPanel
                                    carriers={carriers}
                                    isLoading={isLoading}
                                    selectedLoad={selectedLoad}
                                />
                            </div>

                            {/* Matching Suggestions Panel */}
                            <div className="lg:col-span-1">
                                <MatchingSuggestionsPanel
                                    selectedLoad={selectedLoad}
                                    brokerId={brokerId}
                                    onMatchCreated={loadData}
                                />
                            </div>
                        </div>

                        <DragOverlay>
                            {draggedLoad ? (
                                <div className="bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4 opacity-90">
                                    <div className="font-semibold">{draggedLoad.shipment_number}</div>
                                    <div className="text-sm text-gray-600">{draggedLoad.weight_kg}kg</div>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <MatchingHistoryView brokerId={brokerId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
