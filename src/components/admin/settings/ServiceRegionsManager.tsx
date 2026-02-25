'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MapPicker } from '@/components/maps/MapPicker';
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
    const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
    const [editingRegion, setEditingRegion] = useState<ServiceRegion | null>(null);
    const [formData, setFormData] = useState<ServiceRegion>({
        name: '',
        country: '',
        state_province: '',
        center_lat: undefined,
        center_lng: undefined,
        radius_km: 50,
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
                center_lat: undefined,
                center_lng: undefined,
                radius_km: 50,
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
            toast.success(`Region ${editingRegion ? 'updated' : 'created'}`);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Service Regions</h1>
                    <p className="text-muted-foreground mt-1">Manage geographic coverage areas and geofencing rules</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="rounded-xl px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Region
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse h-[200px] border-none bg-muted/50 rounded-3xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {regions.map((region) => (
                        <Card key={region.id} className="rounded-3xl border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant={region.is_active ? "default" : "secondary"} className="mb-2">
                                        {region.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => handleOpenDialog(region)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-destructive" onClick={() => handleDelete(region.id!)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-bold">{region.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {region.country}{region.state_province ? `, ${region.state_province}` : ''}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1 text-center">Radius</p>
                                        <p className="text-lg font-black text-center">{region.radius_km || 0} <span className="text-[10px] font-medium">km</span></p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl">
                                        <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1 text-center">Method</p>
                                        <p className="text-[10px] font-bold text-center mt-2 leading-tight">
                                            {region.distance_calculation_method === 'haversine' ? 'Straight-line' : 'Road distance'}
                                        </p>
                                    </div>
                                </div>
                                {region.center_lat && region.center_lng && (
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground bg-primary/5 p-2 rounded-lg">
                                        <MapPin className="h-3 w-3 text-primary" />
                                        Centered at {region.center_lat.toFixed(4)}, {region.center_lng.toFixed(4)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                    {regions.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl border-muted flex flex-col items-center gap-4">
                            <div className="bg-muted p-4 rounded-full">
                                <Globe className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold">No service regions defined</p>
                                <p className="text-sm text-muted-foreground px-4">Create your first region to start managing geographic coverage.</p>
                            </div>
                            <Button onClick={() => handleOpenDialog()} variant="outline">Create Region</Button>
                        </div>
                    )}
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] rounded-3xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl font-black">{editingRegion ? 'Edit' : 'Add'} Service Region</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-black uppercase">Region Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    placeholder="e.g. Grand Douala Area"
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-xs font-black uppercase">Country</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        placeholder="e.g. Cameroon"
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state_province" className="text-xs font-black uppercase">State/Province</Label>
                                    <Input
                                        id="state_province"
                                        value={formData.state_province || ''}
                                        placeholder="e.g. Littoral"
                                        onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="radius_km" className="text-xs font-black uppercase flex justify-between">
                                    Service Radius (km)
                                    <span className="text-primary">{formData.radius_km}km</span>
                                </Label>
                                <Input
                                    id="radius_km"
                                    type="number"
                                    value={formData.radius_km}
                                    onChange={(e) => setFormData({ ...formData, radius_km: parseInt(e.target.value) })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="distance_method" className="text-xs font-black uppercase">Distance Calculation</Label>
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

                            <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="is_active" className="text-xs font-bold">Region is Active</Label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs font-black uppercase flex items-center justify-between">
                                Geofence Center
                                <Button
                                    variant="link"
                                    className="p-0 h-auto text-[10px] h-4"
                                    onClick={() => setIsMapPickerOpen(true)}
                                >
                                    Change on Map
                                </Button>
                            </Label>

                            <div className="aspect-square bg-slate-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 gap-4 overflow-hidden relative">
                                {formData.center_lat && formData.center_lng ? (
                                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center flex-col gap-2">
                                        <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                                            <MapPin className="h-6 w-6 text-primary" />
                                        </div>
                                        <p className="text-sm font-bold">Center Point Set</p>
                                        <p className="text-[10px] text-muted-foreground">{formData.center_lat.toFixed(4)}, {formData.center_lng.toFixed(4)}</p>
                                        <Button size="sm" variant="outline" className="mt-2 rounded-full h-8 px-4" onClick={() => setIsMapPickerOpen(true)}>Update Location</Button>
                                    </div>
                                ) : (
                                    <>
                                        <Globe className="h-12 w-12 text-slate-300" />
                                        <p className="text-xs font-medium text-slate-400 text-center px-4">Set a center point on the map to enable distance-based geofencing</p>
                                        <Button size="sm" variant="ghost" className="font-bold underline" onClick={() => setIsMapPickerOpen(true)}>Open Map Picker</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-slate-50 border-t">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancel</Button>
                        <Button onClick={handleSave} className="rounded-xl px-8 font-black">Save Region Config</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Map Picker Dialog */}
            <Dialog open={isMapPickerOpen} onOpenChange={setIsMapPickerOpen}>
                <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle>Point Map Picker</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                        <MapPicker
                            initialCoords={formData.center_lat && formData.center_lng ? { lat: formData.center_lat, lng: formData.center_lng } : undefined}
                            onConfirm={(coords) => {
                                setFormData({ ...formData, center_lat: coords.lat, center_lng: coords.lng });
                                setIsMapPickerOpen(false);
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
