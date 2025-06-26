"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: string[];
    fallbackPath?: string;
    customMessage?: string;
}

export default function RoleGuard({
    children,
    allowedRoles,
    fallbackPath = "/join",
    customMessage,
}: RoleGuardProps) {
    const { data: session, status } = useSession();
    const [hasPermission, setHasPermission] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user) {
            router.push("/login");
            return;
        }

        // ユーザーの役職をチェック
        const userRole = session.user?.role || session.role || "";
        const hasAccess = allowedRoles.includes(userRole);

        setHasPermission(hasAccess);
        setIsLoading(false);

        // 権限がない場合、3秒後にリダイレクト
        if (!hasAccess) {
            setTimeout(() => {
                router.push(fallbackPath);
            }, 3000);
        }
    }, [session, status, router, allowedRoles, fallbackPath]);

    if (status === "loading" || isLoading) {
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

    if (!hasPermission) {
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
                                {customMessage ||
                                    `この機能にアクセスするには ${allowedRoles.join(
                                        " または "
                                    )} の権限が必要です。`}
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

    return <>{children}</>;
}
