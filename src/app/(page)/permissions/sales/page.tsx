"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesData {
    id: string;
    date: string;
    totalRevenue: number;
    totalOrders: number;
    topSellingItems: Array<{
        name: string;
        quantity: number;
        revenue: number;
    }>;
}

interface DailySales {
    date: string;
    revenue: number;
    orders: number;
}

export default function SalesManagementPage() {
    const [salesData, setSalesData] = useState<SalesData | null>(null);
    const [dailySales, setDailySales] = useState<DailySales[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // フィルター用
    const [dateFilter, setDateFilter] = useState("today");
    const [customStartDate, setCustomStartDate] = useState("");
    const [customEndDate, setCustomEndDate] = useState("");

    useEffect(() => {
        loadSalesData();
    }, [dateFilter]);

    const loadSalesData = async () => {
        try {
            setIsLoading(true);

            // 模擬データ
            const mockSalesData: SalesData = {
                id: "1",
                date: new Date().toISOString().split("T")[0],
                totalRevenue: 45600,
                totalOrders: 32,
                topSellingItems: [
                    { name: "特製ラーメン", quantity: 15, revenue: 12000 },
                    { name: "チャーハン", quantity: 12, revenue: 7200 },
                    { name: "餃子", quantity: 8, revenue: 3200 },
                ],
            };

            const mockDailySales: DailySales[] = [
                { date: "2025-06-18", revenue: 45600, orders: 32 },
                { date: "2025-06-17", revenue: 38200, orders: 28 },
                { date: "2025-06-16", revenue: 52100, orders: 35 },
                { date: "2025-06-15", revenue: 41800, orders: 29 },
                { date: "2025-06-14", revenue: 48300, orders: 33 },
                { date: "2025-06-13", revenue: 39600, orders: 27 },
                { date: "2025-06-12", revenue: 44900, orders: 31 },
            ];

            setSalesData(mockSalesData);
            setDailySales(mockDailySales);
        } catch (error) {
            setError("売上データの読み込みに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const exportSalesData = async () => {
        try {
            setIsLoading(true);
            // 実際のエクスポート処理をここに実装
            setSuccess("売上データをエクスポートしました");
        } catch (error) {
            setError("売上データのエクスポートに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `¥${amount.toLocaleString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ja-JP");
    };

    const calculateWeeklyTotal = () => {
        return dailySales.reduce((sum, day) => sum + day.revenue, 0);
    };

    const calculateWeeklyOrders = () => {
        return dailySales.reduce((sum, day) => sum + day.orders, 0);
    };

    const calculateAverageOrderValue = () => {
        const totalRevenue = calculateWeeklyTotal();
        const totalOrders = calculateWeeklyOrders();
        return totalOrders > 0 ? totalRevenue / totalOrders : 0;
    };

    return (
        <PermissionGuard requiredPermissions={["sales_read", "sales_write"]}>
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-3xl font-bold mb-2">売上管理</h1>
                        <p className="text-gray-600">
                            サークルの売上を分析・管理します
                        </p>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview">売上概要</TabsTrigger>
                            <TabsTrigger value="daily">日次売上</TabsTrigger>
                            <TabsTrigger value="reports">レポート</TabsTrigger>
                        </TabsList>

                        {/* 売上概要 */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>今日の売上</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">
                                            {salesData &&
                                                formatCurrency(
                                                    salesData.totalRevenue
                                                )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            注文数: {salesData?.totalOrders}件
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>週間売上合計</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(
                                                calculateWeeklyTotal()
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            注文数: {calculateWeeklyOrders()}件
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>平均注文単価</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-purple-600">
                                            {formatCurrency(
                                                Math.round(
                                                    calculateAverageOrderValue()
                                                )
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            週間平均
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle>人気メニュー</CardTitle>
                                    <CardDescription>
                                        今日の売上上位メニュー
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {salesData?.topSellingItems.map(
                                            (item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 border rounded-lg"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Badge variant="outline">
                                                            #{index + 1}
                                                        </Badge>
                                                        <span className="font-medium">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold">
                                                            {formatCurrency(
                                                                item.revenue
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {item.quantity}
                                                            個販売
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 日次売上 */}
                        <TabsContent value="daily" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>日次売上推移</CardTitle>
                                    <CardDescription>
                                        過去7日間の売上実績
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {dailySales.map((day, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {formatDate(day.date)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {day.orders}件の注文
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold">
                                                        {formatCurrency(
                                                            day.revenue
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        平均単価:{" "}
                                                        {formatCurrency(
                                                            Math.round(
                                                                day.revenue /
                                                                    day.orders
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* レポート */}
                        <TabsContent value="reports" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>売上レポート</CardTitle>
                                    <CardDescription>
                                        売上データをエクスポートします
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>期間選択</Label>
                                        <Select
                                            value={dateFilter}
                                            onValueChange={setDateFilter}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="today">
                                                    今日
                                                </SelectItem>
                                                <SelectItem value="week">
                                                    今週
                                                </SelectItem>
                                                <SelectItem value="month">
                                                    今月
                                                </SelectItem>
                                                <SelectItem value="custom">
                                                    カスタム期間
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {dateFilter === "custom" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>開始日</Label>
                                                <Input
                                                    type="date"
                                                    value={customStartDate}
                                                    onChange={(e) =>
                                                        setCustomStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>終了日</Label>
                                                <Input
                                                    type="date"
                                                    value={customEndDate}
                                                    onChange={(e) =>
                                                        setCustomEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <Button
                                            onClick={exportSalesData}
                                            disabled={isLoading}
                                            className="w-full"
                                        >
                                            {isLoading
                                                ? "エクスポート中..."
                                                : "売上データをエクスポート"}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>売上サマリー</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 border rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatCurrency(
                                                    calculateWeeklyTotal()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                週間売上
                                            </div>
                                        </div>
                                        <div className="text-center p-4 border rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {calculateWeeklyOrders()}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                週間注文数
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <Alert>
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </PermissionGuard>
    );
}
