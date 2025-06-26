"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { usePermissions, Permission } from "@/components/PermissionProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PermissionGuardProps {
    requiredPermissions: Permission[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    customErrorMessage?: string;
}

export default function PermissionGuard({
    requiredPermissions,
    children,
    fallback,
    customErrorMessage,
}: PermissionGuardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const {
        hasAnyPermission,
        isLoading: permissionsLoading,
        error: permissionsError,
    } = usePermissions();

    useEffect(() => {
        if (status === "loading" || permissionsLoading) return;

        if (!session?.user) {
            router.push("/login");
            return;
        }
    }, [session, status, router, permissionsLoading]);

    if (status === "loading" || permissionsLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">読み込み中...</div>
            </div>
        );
    }

    if (!session?.user) {
        return null;
    }

    // 権限エラー
    if (permissionsError) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <Alert variant="destructive">
                        <AlertDescription>
                            権限情報の取得に失敗しました: {permissionsError}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    // 権限チェック
    const hasAccess = hasAnyPermission(requiredPermissions);
    if (!hasAccess) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <Alert variant="destructive">
                        <AlertDescription>
                            {customErrorMessage ||
                                `このページにアクセスする権限がありません。必要な権限: ${requiredPermissions.join(
                                    ", "
                                )}`}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
