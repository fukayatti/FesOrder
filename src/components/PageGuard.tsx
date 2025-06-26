"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import {
    usePermissions,
    Permission,
    PAGE_PERMISSION_MAP,
} from "@/components/PermissionProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface PageGuardProps {
    children: React.ReactNode;
    requiredPermissions?: Permission[];
    fallbackPath?: string;
    allowUnauthenticated?: boolean;
    customErrorMessage?: string;
}

export default function PageGuard({
    children,
    requiredPermissions,
    fallbackPath = "/dashboard",
    allowUnauthenticated = false,
    customErrorMessage,
}: PageGuardProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const {
        hasAnyPermission,
        canAccessPage,
        isLoading: permissionsLoading,
        error: permissionsError,
    } = usePermissions();

    // ページの権限要件を決定
    const pageRequiredPermissions =
        requiredPermissions || PAGE_PERMISSION_MAP[pathname] || [];

    useEffect(() => {
        if (status === "loading" || permissionsLoading) return;

        // 認証が必要で、セッションがない場合
        if (!allowUnauthenticated && !session?.user) {
            router.push("/login");
            return;
        }

        // 権限チェック（認証済みユーザーのみ）
        if (session?.user && pageRequiredPermissions.length > 0) {
            const hasAccess = hasAnyPermission(pageRequiredPermissions);
            if (!hasAccess) {
                // 権限がない場合、3秒後にリダイレクト
                setTimeout(() => {
                    router.push(fallbackPath);
                }, 3000);
            }
        }
    }, [
        session,
        status,
        permissionsLoading,
        pageRequiredPermissions,
        hasAnyPermission,
        router,
        fallbackPath,
        allowUnauthenticated,
    ]);

    // ローディング中
    if (status === "loading" || permissionsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p>権限を確認中...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 認証エラー
    if (!allowUnauthenticated && !session?.user) {
        return null; // useEffectでリダイレクトされる
    }

    // 権限エラー
    if (permissionsError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold text-red-600">
                            エラーが発生しました
                        </CardTitle>
                        <CardDescription>
                            権限情報の取得に失敗しました
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertDescription>
                                {permissionsError}
                            </AlertDescription>
                        </Alert>
                        <div className="mt-4 space-y-2">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full"
                            >
                                再読み込み
                            </Button>
                            <Button
                                onClick={() => router.push("/dashboard")}
                                variant="outline"
                                className="w-full"
                            >
                                ダッシュボードに戻る
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // 権限チェック（認証済みユーザーのみ）
    if (session?.user && pageRequiredPermissions.length > 0) {
        const hasAccess = hasAnyPermission(pageRequiredPermissions);

        if (!hasAccess) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold text-red-600">
                                アクセス権限がありません
                            </CardTitle>
                            <CardDescription>
                                このページは特定の権限を持つユーザーのみアクセス可能です
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert variant="destructive">
                                <AlertDescription>
                                    {customErrorMessage ||
                                        `この機能にアクセスするには以下の権限のいずれかが必要です: ${pageRequiredPermissions.join(
                                            ", "
                                        )}`}
                                </AlertDescription>
                            </Alert>
                            <div className="mt-4 space-y-2">
                                <Button
                                    onClick={() => router.push(fallbackPath)}
                                    className="w-full"
                                >
                                    {fallbackPath === "/join"
                                        ? "招待コードで参加"
                                        : "戻る"}
                                </Button>
                                <Button
                                    onClick={() => router.push("/dashboard")}
                                    variant="outline"
                                    className="w-full"
                                >
                                    ダッシュボードに戻る
                                </Button>
                            </div>
                            <div className="mt-4 text-center text-sm text-gray-500">
                                3秒後に自動でリダイレクトします...
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }
    }

    return <>{children}</>;
}
