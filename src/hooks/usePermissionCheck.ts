"use client";

import { useCallback } from "react";

import { usePermissions, Permission } from "@/components/PermissionProvider";

interface UsePermissionCheckReturn {
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    hasAllPermissions: (permissions: Permission[]) => boolean;
    canAccessPage: (pathname: string) => boolean;
    checkPermissionWithFallback: (
        permission: Permission,
        fallback: () => void
    ) => boolean;
    executeWithPermission: <T>(
        permission: Permission,
        action: () => T,
        fallbackAction?: () => void
    ) => T | undefined;
    isAdmin: () => boolean;
    isManager: () => boolean;
    isStaff: () => boolean;
    getUserRole: () => string | null;
}

export function usePermissionCheck(): UsePermissionCheckReturn {
    const {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessPage,
        userProfile,
    } = usePermissions();

    const checkPermissionWithFallback = useCallback(
        (permission: Permission, fallback: () => void): boolean => {
            const hasAccess = hasPermission(permission);
            if (!hasAccess) {
                fallback();
            }
            return hasAccess;
        },
        [hasPermission]
    );

    const executeWithPermission = useCallback(
        <T>(
            permission: Permission,
            action: () => T,
            fallbackAction?: () => void
        ): T | undefined => {
            if (hasPermission(permission)) {
                return action();
            } else {
                fallbackAction?.();
                return undefined;
            }
        },
        [hasPermission]
    );

    const isAdmin = useCallback((): boolean => {
        return (
            userProfile?.role === "admin" || userProfile?.permission === "admin"
        );
    }, [userProfile]);

    const isManager = useCallback((): boolean => {
        return userProfile?.role === "manager" || isAdmin();
    }, [userProfile, isAdmin]);

    const isStaff = useCallback((): boolean => {
        return (
            userProfile?.role === "staff" ||
            userProfile?.role === "manager" ||
            isAdmin()
        );
    }, [userProfile, isAdmin]);

    const getUserRole = useCallback((): string | null => {
        return userProfile?.role || null;
    }, [userProfile]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessPage,
        checkPermissionWithFallback,
        executeWithPermission,
        isAdmin,
        isManager,
        isStaff,
        getUserRole,
    };
}
