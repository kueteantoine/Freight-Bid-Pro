'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getAllAdminUsers, assignAdminRole, revokeAdminRole, revokeAdminAccess } from '@/lib/services/admin/admin-permissions';
import { UserPlus, UserMinus, ShieldX, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SmartAddAdminDialog } from './SmartAddAdminDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminUserList() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionType, setActionType] = useState<'assign' | 'revoke' | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [isSmartAddOpen, setIsSmartAddOpen] = useState(false);
    const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        const result = await getAllAdminUsers();
        if (result.success) {
            setUsers(result.data || []);
        }
        setLoading(false);
    }

    async function handleAssignRole() {
        if (!selectedUser || !selectedRole) return;

        setSubmitting(true);
        const result = await assignAdminRole(selectedUser.user_id, selectedRole as any);

        if (result.success) {
            toast({
                title: 'Role Assigned',
                description: 'The admin role has been assigned successfully.',
            });
            setSelectedUser(null);
            setSelectedRole('');
            fetchUsers();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to assign role',
                variant: 'destructive',
            });
        }
        setSubmitting(false);
    }

    async function handleRevokeRole(userId: string, roleName: string) {
        setSubmitting(true);
        const result = await revokeAdminRole(userId, roleName as any);

        if (result.success) {
            toast({
                title: 'Role Revoked',
                description: 'The admin role has been revoked.',
            });
            fetchUsers();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to revoke role',
                variant: 'destructive',
            });
        }
        setSubmitting(false);
    }

    async function handleRevokeAllAccess() {
        if (!revokingUserId) return;

        setSubmitting(true);
        const result = await revokeAdminAccess(revokingUserId);

        if (result.success) {
            toast({
                title: 'Access Revoked',
                description: 'All administrative privileges have been revoked for this user.',
            });
            setRevokingUserId(null);
            fetchUsers();
        } else {
            toast({
                title: 'Error',
                description: result.error || 'Failed to revoke access',
                variant: 'destructive',
            });
        }
        setSubmitting(false);
    }

    if (loading) {
        return <div>Loading admin users...</div>;
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Admin Users</CardTitle>
                        <CardDescription>
                            {users.length} admin user{users.length !== 1 ? 's' : ''}
                        </CardDescription>
                    </div>
                    <Button onClick={() => setIsSmartAddOpen(true)} className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Admin
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User ID</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.user_id}>
                                    <TableCell className="font-mono text-sm">{user.user_id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-2">
                                            {user.roles?.map((role: any) => (
                                                <Badge key={role.role_name} className="flex items-center gap-2">
                                                    {role.display_name}
                                                    <button
                                                        onClick={() => handleRevokeRole(user.user_id, role.role_name)}
                                                        className="ml-1 hover:text-destructive"
                                                        disabled={submitting}
                                                    >
                                                        ×
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setActionType('assign');
                                                }}
                                                title="Assign specialized role"
                                            >
                                                <PlusCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setRevokingUserId(user.user_id)}
                                                disabled={submitting}
                                                title="Revoke all admin access"
                                            >
                                                <ShieldX className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog
                open={!!selectedUser}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedUser(null);
                        setActionType(null);
                        setSelectedRole('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Admin Role</DialogTitle>
                        <DialogDescription>Select a role to assign to this user</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Select value={selectedRole} onValueChange={setSelectedRole}>
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

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedUser(null);
                                setActionType(null);
                                setSelectedRole('');
                            }}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAssignRole} disabled={submitting || !selectedRole}>
                            {submitting ? 'Assigning...' : 'Assign Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SmartAddAdminDialog
                open={isSmartAddOpen}
                onOpenChange={setIsSmartAddOpen}
                onSuccess={fetchUsers}
            />

            <AlertDialog open={!!revokingUserId} onOpenChange={(open) => !open && setRevokingUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will revoke **all** administrative privileges for this user.
                            They will no longer be able to access the admin dashboard, but their marketplace roles (like Shipper) will be unaffected.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleRevokeAllAccess();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={submitting}
                        >
                            {submitting ? 'Revoking...' : 'Revoke All Access'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
