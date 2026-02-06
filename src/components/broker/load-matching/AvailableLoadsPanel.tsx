'use client';

import { useDraggable } from '@dnd-kit/core';
import { Truck, Package, MapPin, Calendar, Weight } from 'lucide-react';
import { type AvailableLoad } from '@/actions/broker-load-matching-actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AvailableLoadsPanelProps {
    loads: AvailableLoad[];
    isLoading: boolean;
    onLoadSelect: (load: AvailableLoad) => void;
    selectedLoadId?: string;
}

export default function AvailableLoadsPanel({
    loads,
    isLoading,
    onLoadSelect,
    selectedLoadId,
}: AvailableLoadsPanelProps) {
    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Available Loads</h2>
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
                    <h2 className="text-lg font-semibold">Available Loads</h2>
                    <Badge variant="secondary">{loads.length} loads</Badge>
                </div>

                {loads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No available loads</p>
                        <p className="text-sm">All loads are matched or no shipper clients yet</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {loads.map((load) => (
                            <DraggableLoadCard
                                key={load.id}
                                load={load}
                                isSelected={load.id === selectedLoadId}
                                onSelect={() => onLoadSelect(load)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DraggableLoadCard({
    load,
    isSelected,
    onSelect,
}: {
    load: AvailableLoad;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: load.id,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onSelect}
            className={`
        border rounded-lg p-4 cursor-move transition-all
        ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
      `}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="font-semibold text-sm">{load.shipment_number}</div>
                <Badge variant="outline" className="text-xs">
                    {load.freight_type}
                </Badge>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{load.pickup_location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                    <span className="truncate">{load.delivery_location}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <Weight className="w-3.5 h-3.5" />
                        <span>{load.weight_kg}kg</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        <span className="truncate">{load.preferred_vehicle_type}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(load.scheduled_pickup_date).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                Shipper: {load.shipper_name}
            </div>
        </div>
    );
}
