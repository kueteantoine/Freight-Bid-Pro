'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    getServiceRegions,
    createServiceRegion,
    updateServiceRegion,
    deleteServiceRegion,
    type ServiceRegion,
} from '@/app/actions/service-regions-actions';

export default function ServiceRegionsManager() {
    const [regions, setRegions] = useState<ServiceRegion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<ServiceRegion | null>(null);
    const [formData, setFormData] = useState<ServiceRegion>({
        name: '',
        country: '',
        state_province: '',
        distance_calculation_method: 'haversine',
        is_active: true,
    });


    useEffect(() => {
        loadRegions();
    }, []);

    const loadRegions = async () => {
        setLoading(true);
        const result = await getServiceRegions();
        if (result.success && result.data) setRegions(result.data);
        setLoading(false);
    };

    const handleOpenDialog = (region?: ServiceRegion) => {
        if (region) {
            setEditingRegion(region);
            setFormData(region);
        } else {
            setEditingRegion(null);
            setFormData({
                name: '',
                country: '',
                state_province: '',
                distance_calculation_method: 'haversine',
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        const result = editingRegion
            ? await updateServiceRegion(editingRegion.id!, formData)
            : await createServiceRegion(formData);

        if (result.success) {
            toast({ title: 'Success', description: `Region ${editingRegion ? 'updated' : 'created'}` });
            setIsDialogOpen(false);
            loadRegions();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this region?')) return;
        const result = await deleteServiceRegion(id);
        if (result.success) {
            toast.success('Region deleted');
            loadRegions();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Service Regions</h1>
                    <p className="text-gray-600 mt-1">Manage geographic coverage areas</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Region
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {regions.map((region) => (
                        <Card key={region.id}>
                            <CardHeader>
                                <CardTitle>{region.name}</CardTitle>
                                <p className="text-sm text-gray-600">
                                    {region.country}{region.state_province ? `, ${region.state_province}` : ''}
                                </p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500 mb-4">
                                    Distance: {region.distance_calculation_method === 'haversine' ? 'Straight-line' : 'Road distance'}
                                </p>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(region)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(region.id!)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingRegion ? 'Edit' : 'Add'} Service Region</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="name">Region Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="country">Country *</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="state_province">State/Province</Label>
                                <Input
                                    id="state_province"
                                    value={formData.state_province || ''}
                                    onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="distance_method">Distance Calculation</Label>
                            <Select
                                value={formData.distance_calculation_method}
                                onValueChange={(value: 'haversine' | 'road_distance') =>
                                    setFormData({ ...formData, distance_calculation_method: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="haversine">Straight-line (Haversine)</SelectItem>
                                    <SelectItem value="road_distance">Road Distance</SelectItem>
                                </SelectContent>
                            </Select>
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
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
