'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    getVehicleTypes,
    createVehicleType,
    updateVehicleType,
    deleteVehicleType,
    toggleVehicleTypeStatus,
    type VehicleType,
} from '@/app/actions/vehicle-types-actions';

export default function VehicleTypesManager() {
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<VehicleType | null>(null);
    const [formData, setFormData] = useState<VehicleType>({
        name: '',
        icon: '',
        min_capacity_kg: undefined,
        max_capacity_kg: undefined,
        min_capacity_cubic_meters: undefined,
        max_capacity_cubic_meters: undefined,
        description: '',
        is_active: true,
    });


    useEffect(() => {
        loadVehicleTypes();
    }, []);

    const loadVehicleTypes = async () => {
        setLoading(true);
        const result = await getVehicleTypes();
        if (result.success && result.data) {
            setVehicleTypes(result.data);
        } else {
            toast.error(result.error || 'Failed to load vehicle types');
        }
        setLoading(false);
    };

    const handleOpenDialog = (type?: VehicleType) => {
        if (type) {
            setEditingType(type);
            setFormData(type);
        } else {
            setEditingType(null);
            setFormData({
                name: '',
                icon: '',
                min_capacity_kg: undefined,
                max_capacity_kg: undefined,
                min_capacity_cubic_meters: undefined,
                max_capacity_cubic_meters: undefined,
                description: '',
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        const result = editingType
            ? await updateVehicleType(editingType.id!, formData)
            : await createVehicleType(formData);

        if (result.success) {
            toast.success(`Vehicle type ${editingType ? 'updated' : 'created'} successfully`);
            setIsDialogOpen(false);
            loadVehicleTypes();
        } else {
            toast.error(result.error || 'Failed to save vehicle type');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this vehicle type?')) return;

        const result = await deleteVehicleType(id);
        if (result.success) {
            toast.success('Vehicle type deleted successfully');
            loadVehicleTypes();
        } else {
            toast.error(result.error || 'Failed to delete vehicle type');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const result = await toggleVehicleTypeStatus(id, !currentStatus);
        if (result.success) {
            toast.success(`Vehicle type ${!currentStatus ? 'activated' : 'deactivated'}`);
            loadVehicleTypes();
        } else {
            toast.error(result.error || 'Failed to update status');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vehicle Types</h1>
                    <p className="text-gray-600 mt-1">Manage available vehicle types and capacity ranges</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Vehicle Type
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicleTypes.map((type) => (
                        <Card key={type.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {type.name}
                                            {!type.is_active && (
                                                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Inactive</span>
                                            )}
                                        </CardTitle>
                                        <CardDescription>{type.description}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    {type.min_capacity_kg && type.max_capacity_kg && (
                                        <div>
                                            <span className="font-medium">Weight Capacity:</span> {type.min_capacity_kg} - {type.max_capacity_kg} kg
                                        </div>
                                    )}
                                    {type.min_capacity_cubic_meters && type.max_capacity_cubic_meters && (
                                        <div>
                                            <span className="font-medium">Volume Capacity:</span> {type.min_capacity_cubic_meters} - {type.max_capacity_cubic_meters} m³
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(type)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleToggleStatus(type.id!, type.is_active!)}
                                    >
                                        {type.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(type.id!)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit' : 'Add'} Vehicle Type</DialogTitle>
                        <DialogDescription>
                            Configure vehicle type details and capacity ranges
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Pickup Truck"
                                />
                            </div>
                            <div>
                                <Label htmlFor="icon">Icon</Label>
                                <Input
                                    id="icon"
                                    value={formData.icon || ''}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="Icon name or URL"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of this vehicle type"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="min_capacity_kg">Min Weight Capacity (kg)</Label>
                                <Input
                                    id="min_capacity_kg"
                                    type="number"
                                    value={formData.min_capacity_kg || ''}
                                    onChange={(e) => setFormData({ ...formData, min_capacity_kg: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="max_capacity_kg">Max Weight Capacity (kg)</Label>
                                <Input
                                    id="max_capacity_kg"
                                    type="number"
                                    value={formData.max_capacity_kg || ''}
                                    onChange={(e) => setFormData({ ...formData, max_capacity_kg: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="min_capacity_cubic">Min Volume Capacity (m³)</Label>
                                <Input
                                    id="min_capacity_cubic"
                                    type="number"
                                    step="0.1"
                                    value={formData.min_capacity_cubic_meters || ''}
                                    onChange={(e) => setFormData({ ...formData, min_capacity_cubic_meters: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="max_capacity_cubic">Max Volume Capacity (m³)</Label>
                                <Input
                                    id="max_capacity_cubic"
                                    type="number"
                                    step="0.1"
                                    value={formData.max_capacity_cubic_meters || ''}
                                    onChange={(e) => setFormData({ ...formData, max_capacity_cubic_meters: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                            />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
