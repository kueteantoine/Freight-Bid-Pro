"use client";

import React, { useState } from "react";
import UserDirectory from "@/components/admin/users/UserDirectory";
import UserDetailModal from "@/components/admin/users/UserDetailModal";
import AccountActionsDialog from "@/components/admin/users/AccountActionsDialog";
import BulkOperationsPanel from "@/components/admin/users/BulkOperationsPanel";
import {
    suspendUserAccount,
    reactivateUserAccount,
    resetUserPassword,
} from "@/actions/admin-user-actions";
import { toast } from "sonner";

export default function UsersPage() {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
    const [actionType, setActionType] = useState<'suspend' | 'reactivate' | 'reset-password' | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleViewUser = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleSuspendUser = (userId: string, email?: string) => {
        setSelectedUserId(userId);
        setSelectedUserEmail(email || '');
        setActionType('suspend');
    };

    const handleReactivateUser = (userId: string) => {
        setSelectedUserId(userId);
        setActionType('reactivate');
    };

    const handleResetPassword = (email: string) => {
        setSelectedUserEmail(email);
        setActionType('reset-password');
    };

    const handleActionConfirm = async (reason?: string) => {
        if (!selectedUserId && actionType !== 'reset-password') return;

        try {
            switch (actionType) {
                case 'suspend':
                    if (!reason) {
                        toast.error('Suspension reason is required');
                        return;
                    }
                    await suspendUserAccount(selectedUserId!, reason);
                    toast.success('Account suspended successfully');
                    break;
                case 'reactivate':
                    await reactivateUserAccount(selectedUserId!);
                    toast.success('Account reactivated successfully');
                    break;
                case 'reset-password':
                    await resetUserPassword(selectedUserEmail);
                    toast.success('Password reset email sent successfully');
                    break;
            }
            setRefreshKey(prev => prev + 1);
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
            throw error;
        }
    };

    const handleSelectUser = (userId: string, selected: boolean) => {
        setSelectedUsers(prev =>
            selected
                ? [...prev, userId]
                : prev.filter(id => id !== userId)
        );
    };

    const handleSelectAll = (selected: boolean) => {
        // This will be implemented in UserDirectory to select all visible users
        if (!selected) {
            setSelectedUsers([]);
        }
    };

    const handleClearSelection = () => {
        setSelectedUsers([]);
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                    User Management
                </h1>
                <p className="text-muted-foreground">
                    Manage user accounts, roles, and verification status
                </p>
            </div>

            <BulkOperationsPanel
                selectedUsers={selectedUsers}
                onClearSelection={handleClearSelection}
                onRefresh={handleRefresh}
            />

            <UserDirectory
                key={refreshKey}
                onViewUser={handleViewUser}
                onSuspendUser={handleSuspendUser}
                selectedUsers={selectedUsers}
                onSelectUser={handleSelectUser}
                onSelectAll={handleSelectAll}
            />

            <UserDetailModal
                userId={selectedUserId}
                open={!!selectedUserId && !actionType}
                onClose={() => setSelectedUserId(null)}
                onSuspend={() => setActionType('suspend')}
                onResetPassword={() => {
                    setActionType('reset-password');
                }}
            />

            <AccountActionsDialog
                type={actionType}
                open={!!actionType}
                onClose={() => {
                    setActionType(null);
                    setSelectedUserId(null);
                    setSelectedUserEmail('');
                }}
                onConfirm={handleActionConfirm}
                userEmail={selectedUserEmail}
            />
        </div>
    );
}
