'use client';

import { useDroppable } from '@dnd-kit/core';
import { Building2, Star, TrendingUp, MapPin, Package } from 'lucide-react';
import { type AvailableCarrier, type AvailableLoad } from '@/actions/broker-load-matching-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AvailableCarriersPanelProps {
    carriers: AvailableCarrier[];
    isLoading: boolean;
    selectedLoad?: AvailableLoad | null;
}

export default function AvailableCarriersPanel({
    carriers,
    isLoading,
    selectedLoad,
}: AvailableCarriersPanelProps) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Available Carriers</h2>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse"></div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Available Carriers</h2>
                    <Badge variant="secondary">{carriers.length} carriers</Badge>
                </div>

                {selectedLoad && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <div className="font-medium text-blue-900 mb-1">
                            Drag load here to match
                        </div>
                        <div className="text-blue-700 text-xs">
                            {selectedLoad.shipment_number} • {selectedLoad.weight_kg}kg
                        </div>
                    </div>
                )}

                {carriers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No available carriers</p>
                        <p className="text-sm">Add carriers to your network</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {carriers.map((carrier) => (
                            <DroppableCarrierCard
                                key={carrier.carrier_user_id}
                                carrier={carrier}
                                selectedLoad={selectedLoad}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DroppableCarrierCard({
    carrier,
    selectedLoad,
}: {
    carrier: AvailableCarrier;
    selectedLoad?: AvailableLoad | null;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: carrier.carrier_user_id,
    });

    // Check if carrier can handle the selected load
    const canHandle = selectedLoad
        ? carrier.available_weight_kg >= selectedLoad.weight_kg
        : true;

    return (
        <div
            ref={setNodeRef}
            className={`
        border rounded-lg p-4 transition-all
        ${isOver && canHandle ? 'border-green-500 bg-green-50 shadow-lg' : ''}
        ${isOver && !canHandle ? 'border-red-500 bg-red-50' : ''}
        ${!isOver ? 'border-gray-200 bg-white hover:shadow-md' : ''}
      `}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                    <div className="font-semibold text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {carrier.carrier_name}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium">
                            {carrier.reliability_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                            ({carrier.total_shipments_assigned} trips)
                        </span>
                    </div>
                </div>
            </div>

            <div className="space-y-2 text-xs">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600">Available Capacity</span>
                        <span className="font-medium">{carrier.available_weight_kg}kg</span>
                    </div>
                    <Progress value={75} className="h-1.5" />
                </div>

                <div className="flex items-center gap-1.5 text-gray-600">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{carrier.current_location}</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-600">
                    <Package className="w-3.5 h-3.5" />
                    <span className="truncate">
                        {carrier.vehicle_types.join(', ') || 'Various'}
                    </span>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-700 font-medium">
                            {carrier.performance_metrics.on_time_rate}% on-time
                        </span>
                    </div>
                </div>
            </div>

            {selectedLoad && !canHandle && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    Insufficient capacity for this load
                </div>
            )}
        </div>
    );
}
