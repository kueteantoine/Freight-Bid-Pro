'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { findUserByEmail, smartAddAdmin, AdminRoleType } from '@/lib/services/admin/admin-permissions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, UserCheck, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SmartAddAdminDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function SmartAddAdminDialog({ open, onOpenChange, onSuccess }: SmartAddAdminDialogProps) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [userFound, setUserFound] = useState<any>(null);
    const [searched, setSearched] = useState(false);
    const [selectedRole, setSelectedRole] = useState<AdminRoleType>('support_admin');
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    async function handleSearch() {
        if (!email || !email.includes('@')) {
            toast({
                title: 'Invalid Email',
                description: 'Please enter a valid email address.',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        const result = await findUserByEmail(email);
        setLoading(false);
        setSearched(true);

        if (result.success && result.data) {
            setUserFound(result.data);
        } else {
            setUserFound(null);
        }
    }

    async function handleSubmit() {
        setSubmitting(true);
        const result = await smartAddAdmin(email, selectedRole);
        setSubmitting(false);

        if (result.success) {
            toast({
                title: userFound ? 'Admin Promoted' : 'Admin Invited',
                description: userFound
                    ? 'The user has been promoted to admin successfully.'
                    : 'A staff invitation has been sent to the email provided.',
            });
            onSuccess();
            onOpenChange(false);
            resetForm();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to add admin',
                variant: 'destructive',
            });
        }
    }

    function resetForm() {
        setEmail('');
        setUserFound(null);
        setSearched(false);
        setSelectedRole('support_admin');
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm();
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Admin User</DialogTitle>
                    <DialogDescription>
                        Promote an existing user or invite a new recruit to the admin team.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="flex gap-2">
                            <Input
                                id="email"
                                placeholder="staff@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading || submitting}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSearch}
                                disabled={loading || submitting || !email}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {searched && (
                        <div className="rounded-md border p-3 bg-muted/50">
                            {userFound ? (
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full dark:bg-green-900/30">
                                        <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Existing User Found</p>
                                        <p className="text-xs text-muted-foreground">{userFound.email}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-auto">Promote</Badge>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-900/30">
                                        <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">New Staff Member</p>
                                        <p className="text-xs text-muted-foreground">{email}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-auto">Invite</Badge>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="role">Admin Role</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(val) => setSelectedRole(val as AdminRoleType)}
                            disabled={submitting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="financial_admin">Financial Admin</SelectItem>
                                <SelectItem value="content_admin">Content Admin</SelectItem>
                                <SelectItem value="ad_manager">Ad Manager</SelectItem>
                                <SelectItem value="support_admin">Support Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !searched}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {userFound ? 'Promoting...' : 'Inviting...'}
                            </>
                        ) : (
                            userFound ? 'Confirm Promotion' : 'Send Invitation'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
