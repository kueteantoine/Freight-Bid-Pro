'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Megaphone, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createAdvertisement, AdPlacementZone } from '@/lib/services/admin/advertisements';
import { FileUpload } from '@/components/verification/file-upload';

export function CreateAdDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        ad_title: '',
        ad_type: 'banner',
        ad_placement_zone: 'dashboard_banner' as AdPlacementZone,
        ad_content: '',
        ad_image_url: '',
        target_url: '',
        pricing_model: 'cpm',
        price_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        advertiser_type: 'external_business' as any,
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createAdvertisement({
                ...formData,
                price_amount: Number(formData.price_amount),
                approval_status: 'active', // Direct creation by admin sets it to active
            });

            if (result.success) {
                toast({
                    title: 'Advertisement Created',
                    description: 'The advertisement has been created and is now active.',
                });
                setOpen(false);
                setFormData({
                    ad_title: '',
                    ad_type: 'banner',
                    ad_placement_zone: 'dashboard_banner',
                    ad_content: '',
                    ad_image_url: '',
                    target_url: '',
                    pricing_model: 'cpm',
                    price_amount: 0,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    advertiser_type: 'external_business',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to create advertisement',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    New Advertisement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Megaphone className="h-5 w-5 text-primary" />
                            Create Advertisement
                        </DialogTitle>
                        <DialogDescription>
                            Create a new advertisement. Admins can bypass the approval workflow.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ad_title">Ad Title</Label>
                                <Input
                                    id="ad_title"
                                    placeholder="Summer Promotion"
                                    required
                                    value={formData.ad_title}
                                    onChange={(e) => setFormData({ ...formData, ad_title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ad_type">Ad Type</Label>
                                <Select
                                    value={formData.ad_type}
                                    onValueChange={(val) => setFormData({ ...formData, ad_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="banner">Banner Overlay</SelectItem>
                                        <SelectItem value="sidebar">Sidebar Widget</SelectItem>
                                        <SelectItem value="sponsored">Sponsored Item</SelectItem>
                                        <SelectItem value="newsletter">Newsletter Insert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="placement">Placement Zone</Label>
                                <Select
                                    value={formData.ad_placement_zone}
                                    onValueChange={(val: AdPlacementZone) => setFormData({ ...formData, ad_placement_zone: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select zone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dashboard_banner">Dashboard Banner (1200x200)</SelectItem>
                                        <SelectItem value="sidebar">Sidebar (300x250)</SelectItem>
                                        <SelectItem value="sponsored_listing">Sponsored Listing (200x200)</SelectItem>
                                        <SelectItem value="email_newsletter">Email Newsletter (600x150)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="advertiser_type">Advertiser Type</Label>
                                <Select
                                    value={formData.advertiser_type}
                                    onValueChange={(val) => setFormData({ ...formData, advertiser_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="external_business">External Business</SelectItem>
                                        <SelectItem value="internal_user">Internal User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Ad Creative (Image)</Label>
                            <FileUpload
                                label="Upload Image"
                                description="High-quality banner or square image"
                                accept={['image/jpeg', 'image/png', 'image/webp']}
                                maxSizeMB={2}
                                path="creatives"
                                bucket="advertisements"
                                onUploadComplete={(url) => setFormData({ ...formData, ad_image_url: url })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="target_url">Target URL (Redirect)</Label>
                            <Input
                                id="target_url"
                                placeholder="https://example.com/promo"
                                required
                                type="url"
                                value={formData.target_url}
                                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ad_content">Ad Content / Description</Label>
                            <Textarea
                                id="ad_content"
                                placeholder="Short description of the ad campaign..."
                                className="min-h-[100px]"
                                required
                                value={formData.ad_content}
                                onChange={(e) => setFormData({ ...formData, ad_content: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pricing_model">Pricing Model</Label>
                                <Select
                                    value={formData.pricing_model}
                                    onValueChange={(val) => setFormData({ ...formData, pricing_model: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cpm">CPM (Cost per 1k views)</SelectItem>
                                        <SelectItem value="cpc">CPC (Cost per click)</SelectItem>
                                        <SelectItem value="duration">Fixed Duration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="price_amount">Price (XAF)</Label>
                                <Input
                                    id="price_amount"
                                    type="number"
                                    placeholder="25000"
                                    required
                                    value={formData.price_amount}
                                    onChange={(e) => setFormData({ ...formData, price_amount: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    required
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !formData.ad_image_url}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Advertisement'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
