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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Megaphone, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/verification/file-upload';
import {
    checkAdEligibility,
    createUserAdvertisement,
    type CreateUserAdInput,
} from '@/app/actions/user-ad-actions';

interface UserAdDialogProps {
    onSuccess?: () => void;
}

export function UserAdDialog({ onSuccess }: UserAdDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checkingEligibility, setCheckingEligibility] = useState(false);
    const [eligibility, setEligibility] = useState<any>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState<CreateUserAdInput>({
        ad_title: '',
        ad_type: 'banner',
        ad_placement_zone: 'dashboard_banner',
        ad_content: '',
        ad_image_url: '',
        target_url: '',
        pricing_model: 'duration',
        price_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    async function handleOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (isOpen && !eligibility) {
            // Check eligibility when dialog opens
            setCheckingEligibility(true);
            const result = await checkAdEligibility();
            setCheckingEligibility(false);
            if (result.success) {
                setEligibility(result.data);
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createUserAdvertisement(formData);

            if (result.success) {
                toast({
                    title: 'Advertisement Submitted',
                    description: 'Your advertisement has been submitted for admin approval.',
                });
                setOpen(false);
                setFormData({
                    ad_title: '',
                    ad_type: 'banner',
                    ad_placement_zone: 'dashboard_banner',
                    ad_content: '',
                    ad_image_url: '',
                    target_url: '',
                    pricing_model: 'duration',
                    price_amount: 0,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0],
                });
                onSuccess?.();
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Create Advertisement
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
                            Submit your advertisement for admin approval. All ads are reviewed before going
                            live.
                        </DialogDescription>
                    </DialogHeader>

                    {checkingEligibility && (
                        <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Checking eligibility...
                        </div>
                    )}

                    {eligibility && !eligibility.eligible && (
                        <Alert variant="destructive" className="my-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-2">
                                    You do not meet the requirements to create advertisements:
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                    {eligibility.reasons?.map((reason: string, index: number) => (
                                        <li key={index} className="text-sm">
                                            {reason}
                                        </li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {eligibility?.eligible && (
                        <Alert className="my-4 border-green-500/50 bg-green-500/10">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <AlertDescription className="text-green-700 dark:text-green-400">
                                You meet all requirements to create advertisements!
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="grid gap-6 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ad_title">Ad Title *</Label>
                                <Input
                                    id="ad_title"
                                    placeholder="Premium Fleet Services"
                                    required
                                    value={formData.ad_title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, ad_title: e.target.value })
                                    }
                                    disabled={!eligibility?.eligible}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ad_type">Ad Type *</Label>
                                <Select
                                    value={formData.ad_type}
                                    onValueChange={(val) => setFormData({ ...formData, ad_type: val })}
                                    disabled={!eligibility?.eligible}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="banner">Banner Overlay</SelectItem>
                                        <SelectItem value="sidebar">Sidebar Widget</SelectItem>
                                        <SelectItem value="sponsored">Sponsored Item</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="placement">Placement Zone *</Label>
                            <Select
                                value={formData.ad_placement_zone}
                                onValueChange={(val: any) =>
                                    setFormData({ ...formData, ad_placement_zone: val })
                                }
                                disabled={!eligibility?.eligible}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select zone" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dashboard_banner">
                                        Dashboard Banner (1200x200)
                                    </SelectItem>
                                    <SelectItem value="sidebar">Sidebar (300x250)</SelectItem>
                                    <SelectItem value="sponsored_listing">
                                        Sponsored Listing (200x200)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Ad Creative (Image) *</Label>
                            <FileUpload
                                label="Upload Image"
                                description="High-quality banner or square image"
                                accept={['image/jpeg', 'image/png', 'image/webp']}
                                maxSizeMB={2}
                                path="creatives"
                                bucket="advertisements"
                                onUploadComplete={(url) =>
                                    setFormData({ ...formData, ad_image_url: url })
                                }
                                disabled={!eligibility?.eligible}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="target_url">Target URL (Redirect) *</Label>
                            <Input
                                id="target_url"
                                placeholder="https://example.com/promo"
                                required
                                type="url"
                                value={formData.target_url}
                                onChange={(e) =>
                                    setFormData({ ...formData, target_url: e.target.value })
                                }
                                disabled={!eligibility?.eligible}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ad_content">Ad Content / Description *</Label>
                            <Textarea
                                id="ad_content"
                                placeholder="Describe your advertisement campaign..."
                                className="min-h-[100px]"
                                required
                                value={formData.ad_content}
                                onChange={(e) =>
                                    setFormData({ ...formData, ad_content: e.target.value })
                                }
                                disabled={!eligibility?.eligible}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date *</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    required
                                    value={formData.start_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, start_date: e.target.value })
                                    }
                                    disabled={!eligibility?.eligible}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date *</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    required
                                    value={formData.end_date}
                                    onChange={(e) =>
                                        setFormData({ ...formData, end_date: e.target.value })
                                    }
                                    disabled={!eligibility?.eligible}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || !formData.ad_image_url || !eligibility?.eligible}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit for Approval'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
