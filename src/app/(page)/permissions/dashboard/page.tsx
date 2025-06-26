"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import PermissionGuard from "@/components/PermissionGuard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface DashboardStats {
    totalMenuItems: number;
    activeOrders: number;
    dailyRevenue: number;
    totalUsers: number;
}

interface QuickAction {
    title: string;
    description: string;
    path: string;
    requiredPermissions: string[];
    color: string;
}

export default function PermissionDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const quickActions: QuickAction[] = [
        {
            title: "メニュー管理",
            description: "メニューアイテムの追加・編集・削除",
            path: "/permissions/menu",
            requiredPermissions: ["menu_read", "menu_write"],
            color: "bg-blue-100 text-blue-800",
        },
        {
            title: "注文管理",
            description: "注文の確認・ステータス更新",
            path: "/permissions/orders",
            requiredPermissions: ["order_read", "order_write"],
            color: "bg-green-100 text-green-800",
        },
        {
            title: "売上管理",
            description: "売上分析・レポート生成",
            path: "/permissions/sales",
            requiredPermissions: ["sales_read", "sales_write"],
            color: "bg-purple-100 text-purple-800",
        },
        {
            title: "ユーザー管理",
            description: "メンバー情報・権限管理",
            path: "/permissions/users",
            requiredPermissions: ["user_read", "user_write"],
            color: "bg-orange-100 text-orange-800",
        },
        {
            title: "招待管理",
            description: "新メンバーの招待コード作成",
            path: "/user/me",
            requiredPermissions: ["invite_create"],
            color: "bg-pink-100 text-pink-800",
        },
        {
            title: "システム管理",
            description: "全体設定・システム管理",
            path: "/dashboard",
            requiredPermissions: ["dashboard_access"],
            color: "bg-red-100 text-red-800",
        },
    ];

    useEffect(() => {
        loadDashboardData();
        loadUserPermissions();
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            // 模擬データ
            const mockStats: DashboardStats = {
                totalMenuItems: 15,
                activeOrders: 8,
                dailyRevenue: 45600,
                totalUsers: 25,
            };
            setStats(mockStats);
        } catch (error) {
            setError("ダッシュボードデータの読み込みに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const loadUserPermissions = async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const user = await response.json();
                const permissions = user.permission
                    ? user.permission.split(",")
                    : [];

                // 管理者は全ての権限を持つ
                if (user.role === "admin" || user.permission === "admin") {
                    setUserPermissions([
                        "menu_read",
                        "menu_write",
                        "order_read",
                        "order_write",
                        "sales_read",
                        "sales_write",
                        "user_read",
                        "user_write",
                        "invite_create",
                        "dashboard_access",
                    ]);
                } else {
                    setUserPermissions(permissions);
                }
            }
        } catch (error) {
            console.error("ユーザー権限の取得に失敗:", error);
        }
    };

    const hasPermission = (requiredPermissions: string[]) => {
        return requiredPermissions.some((permission) =>
            userPermissions.includes(permission)
        );
    };

    const navigateTo = (path: string) => {
        router.push(path);
    };

    const formatCurrency = (amount: number) => {
        return `¥${amount.toLocaleString()}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">読み込み中...</div>
            </div>
        );
    }

    return (
        <PermissionGuard
            requiredPermissions={[
                "dashboard_access",
                "menu_read",
                "order_read",
                "sales_read",
                "user_read",
                "invite_create",
            ]}
        >
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-3xl font-bold mb-2">
                            権限ダッシュボード
                        </h1>
                        <p className="text-gray-600">
                            あなたの権限に基づいた機能にアクセスできます
                        </p>
                    </div>

                    {/* 統計情報 */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        メニューアイテム
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">
                                        {stats.totalMenuItems}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        登録済み
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        処理中注文
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {stats.activeOrders}
                                    </div>
                                    <p className="text-xs text-gray-500">件</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        本日の売上
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-purple-600">
                                        {formatCurrency(stats.dailyRevenue)}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        今日
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-600">
                                        登録ユーザー
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {stats.totalUsers}
                                    </div>
                                    <p className="text-xs text-gray-500">人</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* クイックアクション */}
                    <Card>
                        <CardHeader>
                            <CardTitle>利用可能な機能</CardTitle>
                            <CardDescription>
                                あなたの権限で利用できる機能の一覧
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {quickActions.map((action, index) => {
                                    const hasAccess = hasPermission(
                                        action.requiredPermissions
                                    );
                                    return (
                                        <div
                                            key={index}
                                            className={`border rounded-lg p-4 transition-opacity ${
                                                hasAccess
                                                    ? "cursor-pointer hover:shadow-md"
                                                    : "opacity-50"
                                            }`}
                                            onClick={() =>
                                                hasAccess &&
                                                navigateTo(action.path)
                                            }
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold">
                                                    {action.title}
                                                </h3>
                                                {hasAccess ? (
                                                    <Badge
                                                        className={action.color}
                                                    >
                                                        利用可能
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        権限なし
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">
                                                {action.description}
                                            </p>
                                            <div className="text-xs text-gray-500">
                                                必要権限:{" "}
                                                {action.requiredPermissions.join(
                                                    ", "
                                                )}
                                            </div>
                                            {hasAccess && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-3 w-full"
                                                >
                                                    開く
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 権限情報 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>あなたの権限</CardTitle>
                            <CardDescription>
                                現在付与されている権限の一覧
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {userPermissions.length > 0 ? (
                                    userPermissions.map((permission, index) => (
                                        <Badge key={index} variant="outline">
                                            {permission}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-gray-500">
                                        権限が設定されていません
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
