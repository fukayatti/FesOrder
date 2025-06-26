"use client";

import { useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState } from "react";

// 権限の定義
export const PERMISSIONS = {
    // ダッシュボード関連
    DASHBOARD_VIEW: "dashboard_view",

    // メニュー関連
    MENU_READ: "menu_read",
    MENU_WRITE: "menu_write",
    MENU_DELETE: "menu_delete",

    // 注文関連
    ORDER_READ: "order_read",
    ORDER_WRITE: "order_write",
    ORDER_UPDATE: "order_update",
    ORDER_DELETE: "order_delete",

    // 売上関連
    SALES_READ: "sales_read",
    SALES_WRITE: "sales_write",

    // ユーザー管理関連
    USER_READ: "user_read",
    USER_WRITE: "user_write",
    USER_DELETE: "user_delete",

    // システム管理
    ADMIN_PANEL: "admin_panel",
    SETTINGS_MANAGE: "settings_manage",

    // その他
    REPORTS_VIEW: "reports_view",
    ANALYTICS_VIEW: "analytics_view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ロール別権限の定義
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    admin: Object.values(PERMISSIONS), // 管理者は全権限
    manager: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MENU_READ,
        PERMISSIONS.MENU_WRITE,
        PERMISSIONS.MENU_DELETE,
        PERMISSIONS.ORDER_READ,
        PERMISSIONS.ORDER_WRITE,
        PERMISSIONS.ORDER_UPDATE,
        PERMISSIONS.SALES_READ,
        PERMISSIONS.SALES_WRITE,
        PERMISSIONS.USER_READ,
        PERMISSIONS.USER_WRITE,
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.ANALYTICS_VIEW,
    ],
    staff: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MENU_READ,
        PERMISSIONS.ORDER_READ,
        PERMISSIONS.ORDER_WRITE,
        PERMISSIONS.ORDER_UPDATE,
        PERMISSIONS.SALES_READ,
    ],
    volunteer: [
        PERMISSIONS.DASHBOARD_VIEW,
        PERMISSIONS.MENU_READ,
        PERMISSIONS.ORDER_READ,
    ],
    custom: [], // カスタムロールは個別に権限を設定
};

// ページと必要な権限のマッピング
export const PAGE_PERMISSION_MAP: Record<string, Permission[]> = {
    "/dashboard": [PERMISSIONS.DASHBOARD_VIEW],
    "/dashboard/menus": [PERMISSIONS.MENU_READ],
    "/dashboard/orders": [PERMISSIONS.ORDER_READ],
    "/dashboard/sales": [PERMISSIONS.SALES_READ],
    "/permissions/menu": [PERMISSIONS.MENU_READ, PERMISSIONS.MENU_WRITE],
    "/permissions/orders": [PERMISSIONS.ORDER_READ, PERMISSIONS.ORDER_WRITE],
    "/permissions/sales": [PERMISSIONS.SALES_READ, PERMISSIONS.SALES_WRITE],
    "/permissions/users": [PERMISSIONS.USER_READ, PERMISSIONS.USER_WRITE],
    "/permissions/dashboard": [PERMISSIONS.ADMIN_PANEL],
    "/backyard": [PERMISSIONS.ADMIN_PANEL],
};

interface UserProfile {
    name: string;
    email: string;
    role: string;
    permission: string;
    circle: string;
}

interface PermissionContextType {
    userProfile: UserProfile | null;
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    hasAllPermissions: (permissions: Permission[]) => boolean;
    canAccessPage: (pathname: string) => boolean;
    isLoading: boolean;
    error: string | null;
    refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(
    undefined
);

export function usePermissions() {
    const context = useContext(PermissionContext);
    if (context === undefined) {
        throw new Error(
            "usePermissions must be used within a PermissionProvider"
        );
    }
    return context;
}

interface PermissionProviderProps {
    children: React.ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
    const { data: session, status } = useSession();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUserProfile = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const user = await response.json();
                setUserProfile(user);
            } else {
                setError("ユーザー情報の取得に失敗しました");
            }
        } catch (err) {
            setError("ネットワークエラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === "loading") return;

        if (session?.user) {
            loadUserProfile();
        } else {
            setIsLoading(false);
        }
    }, [session, status]);

    const getUserPermissions = (): Permission[] => {
        if (!userProfile) return [];

        // 管理者は全権限
        if (
            userProfile.role === "admin" ||
            userProfile.permission === "admin"
        ) {
            return Object.values(PERMISSIONS);
        }

        // ロール基準の権限
        const rolePermissions = ROLE_PERMISSIONS[userProfile.role] || [];

        // カスタム権限（カンマ区切りで複数の権限が設定されている場合を考慮）
        const customPermissions = userProfile.permission
            ? userProfile.permission.split(",").filter(Boolean)
            : [];

        // 両方の権限をマージ（重複を除去）
        return Array.from(
            new Set([
                ...rolePermissions,
                ...(customPermissions as Permission[]),
            ])
        );
    };

    const hasPermission = (permission: Permission): boolean => {
        const userPermissions = getUserPermissions();
        return userPermissions.includes(permission);
    };

    const hasAnyPermission = (permissions: Permission[]): boolean => {
        return permissions.some((permission) => hasPermission(permission));
    };

    const hasAllPermissions = (permissions: Permission[]): boolean => {
        return permissions.every((permission) => hasPermission(permission));
    };

    const canAccessPage = (pathname: string): boolean => {
        const requiredPermissions = PAGE_PERMISSION_MAP[pathname];
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true; // 権限が定義されていないページはアクセス可能
        }
        return hasAnyPermission(requiredPermissions);
    };

    const refreshPermissions = async () => {
        await loadUserProfile();
    };

    const value: PermissionContextType = {
        userProfile,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessPage,
        isLoading,
        error,
        refreshPermissions,
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
}
