'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
    getFreightCategories,
    createFreightCategory,
    updateFreightCategory,
    deleteFreightCategory,
    toggleCategoryRestriction,
    type FreightCategory,
} from '@/app/actions/freight-categories-actions';

export default function FreightCategoriesManager() {
    const [categories, setCategories] = useState<FreightCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<FreightCategory | null>(null);
    const [formData, setFormData] = useState<FreightCategory>({
        name: '',
        description: '',
        special_requirements: '',
        is_restricted: false,
        is_active: true,
    });


    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const result = await getFreightCategories();
        if (result.success && result.data) {
            setCategories(result.data);
        }
        setLoading(false);
    };

    const handleOpenDialog = (category?: FreightCategory) => {
        if (category) {
            setEditingCategory(category);
            setFormData(category);
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                special_requirements: '',
                is_restricted: false,
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        const result = editingCategory
            ? await updateFreightCategory(editingCategory.id!, formData)
            : await createFreightCategory(formData);

        if (result.success) {
            toast({ title: 'Success', description: `Category ${editingCategory ? 'updated' : 'created'} successfully` });
            setIsDialogOpen(false);
            loadCategories();
        } else {
            toast.error(result.error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this category?')) return;
        const result = await deleteFreightCategory(id);
        if (result.success) {
            toast.success('Category deleted');
            loadCategories();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Freight Categories</h1>
                    <p className="text-gray-600 mt-1">Manage freight classifications and requirements</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <Card key={category.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {category.name}
                                    {category.is_restricted && (
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                </CardTitle>
                                <CardDescription>{category.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {category.special_requirements && (
                                    <p className="text-sm text-gray-600 mb-4">{category.special_requirements}</p>
                                )}
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenDialog(category)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(category.id!)}>
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
                        <DialogTitle>{editingCategory ? 'Edit' : 'Add'} Freight Category</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="special_requirements">Special Requirements</Label>
                            <Textarea
                                id="special_requirements"
                                value={formData.special_requirements || ''}
                                onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_restricted"
                                checked={formData.is_restricted}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_restricted: checked })}
                            />
                            <Label htmlFor="is_restricted">Restricted (Hazardous)</Label>
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
