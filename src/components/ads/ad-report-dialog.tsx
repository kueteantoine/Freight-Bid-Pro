'use client';

import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { reportAdvertisement } from '@/app/actions/ad-compliance-actions';

interface AdReportDialogProps {
    adId: string;
    adTitle: string;
    trigger?: React.ReactNode;
}

const REPORT_REASONS = [
    { value: 'misleading', label: 'Misleading or Scam' },
    { value: 'offensive', label: 'Offensive or Inappropriate' },
    { value: 'spam', label: 'Spam or Repetitive' },
    { value: 'broken', label: 'Broken Link or Malfunctioning' },
    { value: 'offensive_image', label: 'Inappropriate Image' },
    { value: 'other', label: 'Other' },
];

export function AdReportDialog({ adId, adTitle, trigger }: AdReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState<string>('');
    const [details, setDetails] = useState('');

    const handleSubmit = async () => {
        if (!reason) {
            toast.error('Please select a reason for reporting');
            return;
        }

        setLoading(true);
        try {
            const result = await reportAdvertisement(adId, reason, details);
            if (result.success) {
                toast.success('Thank you for your report. We will review it shortly.');
                setOpen(false);
                setReason('');
                setDetails('');
            } else {
                toast.error(result.error || 'Failed to submit report');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10 rounded-full report-button"
                        title="Report this ad"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <Flag className="h-3 w-3" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-red-500" />
                        Report Advertisement
                    </DialogTitle>
                    <DialogDescription>
                        Help us keep the platform safe. Why are you reporting "{adTitle}"?
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger id="reason">
                                <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {REPORT_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="details">Additional Details (Optional)</Label>
                        <Textarea
                            id="details"
                            placeholder="Please provide more context..."
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={loading || !reason}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            'Submit Report'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
