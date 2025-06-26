"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePermissions, PERMISSIONS } from "@/components/PermissionProvider";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface NavigationItem {
    label: string;
    href: string;
    description: string;
    requiredPermissions: string[];
    icon?: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
    {
        label: "ダッシュボード",
        href: "/dashboard",
        description: "システムの概要と基本情報",
        requiredPermissions: [PERMISSIONS.DASHBOARD_VIEW],
        icon: "📊",
    },
    {
        label: "注文管理",
        href: "/permissions/orders",
        description: "注文の受付、確認、ステータス管理",
        requiredPermissions: [PERMISSIONS.ORDER_READ],
        icon: "📋",
    },
    {
        label: "メニュー管理",
        href: "/permissions/menu",
        description: "メニューアイテムの追加、編集、削除",
        requiredPermissions: [PERMISSIONS.MENU_READ],
        icon: "🍽️",
    },
    {
        label: "売上管理",
        href: "/permissions/sales",
        description: "売上データの確認と分析",
        requiredPermissions: [PERMISSIONS.SALES_READ],
        icon: "💰",
    },
    {
        label: "ユーザー管理",
        href: "/permissions/users",
        description: "ユーザーアカウントと権限の管理",
        requiredPermissions: [PERMISSIONS.USER_READ],
        icon: "👥",
    },
    {
        label: "システム管理",
        href: "/permissions/dashboard",
        description: "システム設定と管理者機能",
        requiredPermissions: [PERMISSIONS.ADMIN_PANEL],
        icon: "⚙️",
    },
    {
        label: "バックヤード",
        href: "/backyard",
        description: "高度な管理機能とシステム設定",
        requiredPermissions: [PERMISSIONS.ADMIN_PANEL],
        icon: "🔧",
    },
];

interface ProtectedNavigationProps {
    showDescription?: boolean;
    cardLayout?: boolean;
    maxColumns?: number;
}

export default function ProtectedNavigation({
    showDescription = true,
    cardLayout = true,
    maxColumns = 3,
}: ProtectedNavigationProps) {
    const pathname = usePathname();
    const { hasAnyPermission, isLoading } = usePermissions();

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // ユーザーがアクセス可能なナビゲーションアイテムをフィルタリング
    const accessibleItems = NAVIGATION_ITEMS.filter((item) =>
        hasAnyPermission(item.requiredPermissions as any[])
    );

    if (accessibleItems.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <p className="text-gray-500">
                        アクセス可能な機能がありません。
                        <br />
                        管理者に権限の付与を依頼してください。
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (cardLayout) {
        return (
            <div
                className={`grid gap-4 md:grid-cols-2 lg:grid-cols-${maxColumns}`}
            >
                {accessibleItems.map((item) => (
                    <Card
                        key={item.href}
                        className={`transition-all hover:shadow-lg ${
                            pathname === item.href
                                ? "ring-2 ring-blue-500 bg-blue-50"
                                : "hover:bg-gray-50"
                        }`}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-center space-x-2">
                                {item.icon && (
                                    <span className="text-2xl">
                                        {item.icon}
                                    </span>
                                )}
                                <CardTitle className="text-lg">
                                    {item.label}
                                </CardTitle>
                            </div>
                            {showDescription && (
                                <CardDescription>
                                    {item.description}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-0">
                            <Link href={item.href}>
                                <Button
                                    variant={
                                        pathname === item.href
                                            ? "default"
                                            : "outline"
                                    }
                                    className="w-full"
                                >
                                    {pathname === item.href
                                        ? "現在のページ"
                                        : "開く"}
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // シンプルなリスト形式
    return (
        <div className="space-y-2">
            {accessibleItems.map((item) => (
                <Link key={item.href} href={item.href}>
                    <Button
                        variant={pathname === item.href ? "default" : "ghost"}
                        className="w-full justify-start"
                    >
                        {item.icon && (
                            <span className="mr-2 text-lg">{item.icon}</span>
                        )}
                        {item.label}
                    </Button>
                </Link>
            ))}
        </div>
    );
}
