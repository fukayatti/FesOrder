"use client";

import React from "react";

import PageGuard from "@/components/PageGuard";
import { PERMISSIONS } from "@/components/PermissionProvider";
import ProtectedNavigation from "@/components/ProtectedNavigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const DashboardPage: React.FC = () => {
    return (
        <PageGuard
            requiredPermissions={[PERMISSIONS.DASHBOARD_VIEW]}
            customErrorMessage="ダッシュボードにアクセスするには適切な権限が必要です。"
        >
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* ヘッダー */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-3xl font-bold mb-2">
                            ダッシュボード
                        </h1>
                        <p className="text-gray-600">
                            FesOrder管理システムへようこそ。権限に応じた機能にアクセスできます。
                        </p>
                    </div>

                    {/* 統計情報 */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    今日の注文数
                                </CardTitle>
                                <span className="text-2xl">📋</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">24</div>
                                <p className="text-xs text-muted-foreground">
                                    +12% from yesterday
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    今日の売上
                                </CardTitle>
                                <span className="text-2xl">💰</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ¥45,230
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    +8% from yesterday
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    メニュー数
                                </CardTitle>
                                <span className="text-2xl">🍽️</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">
                                    +2 new items
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    アクティブユーザー
                                </CardTitle>
                                <span className="text-2xl">👥</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">8</div>
                                <p className="text-xs text-muted-foreground">
                                    +1 from last week
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 機能へのアクセス */}
                    <Card>
                        <CardHeader>
                            <CardTitle>利用可能な機能</CardTitle>
                            <CardDescription>
                                あなたの権限でアクセス可能な機能の一覧です
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ProtectedNavigation
                                showDescription={true}
                                cardLayout={true}
                                maxColumns={3}
                            />
                        </CardContent>
                    </Card>

                    {/* 最近のアクティビティ */}
                    <Card>
                        <CardHeader>
                            <CardTitle>最近のアクティビティ</CardTitle>
                            <CardDescription>
                                システムの最新の動向
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            新しい注文が追加されました
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            2分前
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            メニューが更新されました
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            15分前
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            ユーザー権限が変更されました
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            1時間前
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageGuard>
    );
};

export default DashboardPage;
