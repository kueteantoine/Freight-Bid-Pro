'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { upsertTranslation, deleteTranslation, type TranslationInput } from '@/app/actions/translations/translation-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Translation = {
    id: string;
    key: string;
    namespace: string;
    en_value: string;
    fr_value: string;
    created_at: string;
    updated_at: string;
};

export function TranslationsManager({ initialTranslations }: { initialTranslations: Translation[] }) {
    const t = useTranslations('admin');
    const [translations, setTranslations] = useState<Translation[]>(initialTranslations);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<TranslationInput>({
        key: '',
        namespace: 'common',
        en_value: '',
        fr_value: '',
    });

    const filteredTranslations = translations.filter((t) =>
        t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.en_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.fr_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.namespace.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenDialog = (translation?: Translation) => {
        if (translation) {
            setEditingId(translation.id);
            setFormData({
                key: translation.key,
                namespace: translation.namespace,
                en_value: translation.en_value,
                fr_value: translation.fr_value,
            });
        } else {
            setEditingId(null);
            setFormData({
                key: '',
                namespace: 'common',
                en_value: '',
                fr_value: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.key || !formData.namespace || !formData.en_value || !formData.fr_value) {
            toast.error('Please fill in all fields');
            return;
        }

        startTransition(async () => {
            const result = await upsertTranslation(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.success);
                setIsDialogOpen(false);
                // Optimistic UI update
                if (editingId) {
                    setTranslations(translations.map(t => t.id === editingId ? { ...t, ...formData } : t));
                } else {
                    // Note: for a true optimistic update on creation, we'd need a temp ID. 
                    // For now, we'll just reload the page or rely on the router to refresh.
                    window.location.reload();
                }
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this translation?')) return;

        startTransition(async () => {
            const result = await deleteTranslation(id);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.success);
                setTranslations(translations.filter(t => t.id !== id));
            }
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search translations..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Translation
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Namespace</TableHead>
                            <TableHead>Key</TableHead>
                            <TableHead>English Value</TableHead>
                            <TableHead>French Value</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTranslations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No translations found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTranslations.map((t) => (
                                <TableRow key={t.id}>
                                    <TableCell><Badge variant="outline">{t.namespace}</Badge></TableCell>
                                    <TableCell className="font-mono text-sm">{t.key}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={t.en_value}>{t.en_value}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={t.fr_value}>{t.fr_value}</TableCell>
                                    <TableCell>
                                        {(!t.en_value || !t.fr_value || t.en_value === t.fr_value) && (
                                            <Badge variant="destructive" className="flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Needs Review
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(t)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Translation' : 'Add Translation'}</DialogTitle>
                        <DialogDescription>
                            Create or update a dynamic translation key. This will override any static JSON values.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="namespace" className="text-right">
                                Namespace
                            </Label>
                            <Input
                                id="namespace"
                                value={formData.namespace}
                                onChange={(e) => setFormData({ ...formData, namespace: e.target.value })}
                                className="col-span-3"
                                disabled={!!editingId} // Usually namespace/key don't change, just values
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="key" className="text-right">
                                Key
                            </Label>
                            <Input
                                id="key"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                className="col-span-3"
                                disabled={!!editingId}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="en_value" className="text-right">
                                English
                            </Label>
                            <Input
                                id="en_value"
                                value={formData.en_value}
                                onChange={(e) => setFormData({ ...formData, en_value: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fr_value" className="text-right">
                                French
                            </Label>
                            <Input
                                id="fr_value"
                                value={formData.fr_value}
                                onChange={(e) => setFormData({ ...formData, fr_value: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
