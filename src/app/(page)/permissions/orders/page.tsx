"use client";

import { useState, useEffect } from "react";

import PageGuard from "@/components/PageGuard";
import { PERMISSIONS } from "@/components/PermissionProvider";
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

interface Order {
    id: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled";
    createdAt: string;
    notes?: string;
}

interface OrderItem {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    unitPrice: number;
}

const statusLabels = {
    pending: "注文受付",
    confirmed: "注文確認済み",
    preparing: "調理中",
    ready: "受け取り待ち",
    completed: "完了",
    cancelled: "キャンセル",
};

const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
};

export default function OrderManagementPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 新しい注文用
    const [newOrderCustomer, setNewOrderCustomer] = useState("");
    const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([]);
    const [newOrderNotes, setNewOrderNotes] = useState("");

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/orders");
            if (response.ok) {
                const ordersData = await response.json();
                const formattedOrders: Order[] = ordersData.map(
                    (order: any) => {
                        let orderItems: OrderItem[] = [];
                        try {
                            orderItems = JSON.parse(order.orderItems || "[]");
                        } catch (e) {
                            // JSON解析に失敗した場合は空配列
                            orderItems = [];
                        }

                        return {
                            id: order.id,
                            customerName: order.cashier || "不明",
                            items: orderItems,
                            totalAmount: order.totalPrice || 0,
                            status: order.orderState || "pending",
                            createdAt: order.time || new Date().toISOString(),
                            notes: "",
                        };
                    }
                );
                setOrders(formattedOrders);
            } else {
                const errorData = await response.json();
                setError(errorData.error || "注文の読み込みに失敗しました");
            }
        } catch (error) {
            setError("注文の読み込みに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const updateOrderStatus = async (
        orderId: string,
        newStatus: Order["status"]
    ) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderState: newStatus,
                }),
            });

            if (response.ok) {
                setSuccess("注文ステータスを更新しました");
                await loadOrders(); // 注文リストを再読み込み
            } else {
                const errorData = await response.json();
                setError(
                    errorData.error || "注文ステータスの更新に失敗しました"
                );
            }
        } catch (error) {
            setError("注文ステータスの更新に失敗しました");
        }
    };

    const createOrder = async () => {
        if (!newOrderCustomer || newOrderItems.length === 0) {
            setError("お客様名と注文アイテムを入力してください");
            return;
        }

        try {
            setIsLoading(true);
            const totalAmount = newOrderItems.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            );

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderItems: newOrderItems,
                    totalPrice: totalAmount,
                    peopleCount: 1,
                    notes: newOrderNotes,
                }),
            });

            if (response.ok) {
                setNewOrderCustomer("");
                setNewOrderItems([]);
                setNewOrderNotes("");
                setSuccess("新しい注文を作成しました");
                await loadOrders(); // 注文リストを再読み込み
            } else {
                const errorData = await response.json();
                setError(errorData.error || "注文の作成に失敗しました");
            }
        } catch (error) {
            setError("注文の作成に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("ja-JP");
    };

    return (
        <PermissionGuard
            requiredPermissions={[
                PERMISSIONS.ORDER_READ,
                PERMISSIONS.ORDER_WRITE,
            ]}
            customErrorMessage="注文管理機能にアクセスするには注文の読み取りと書き込み権限が必要です。"
        >
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-3xl font-bold mb-2">注文管理</h1>
                        <p className="text-gray-600">
                            サークルの注文を管理します
                        </p>
                    </div>

                    <Tabs defaultValue="list" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list">注文一覧</TabsTrigger>
                            <TabsTrigger value="create">新規注文</TabsTrigger>
                        </TabsList>

                        {/* 注文一覧 */}
                        <TabsContent value="list" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>現在の注文</CardTitle>
                                    <CardDescription>
                                        受け付けた注文の一覧と管理
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div
                                                key={order.id}
                                                className="border rounded-lg p-4"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center space-x-3">
                                                        <h3 className="font-semibold text-lg">
                                                            注文#{order.id}
                                                        </h3>
                                                        <Badge
                                                            className={
                                                                statusColors[
                                                                    order.status
                                                                ]
                                                            }
                                                        >
                                                            {
                                                                statusLabels[
                                                                    order.status
                                                                ]
                                                            }
                                                        </Badge>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500">
                                                            {formatDate(
                                                                order.createdAt
                                                            )}
                                                        </p>
                                                        <p className="font-bold text-lg">
                                                            ¥
                                                            {order.totalAmount.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <p className="font-medium">
                                                        お客様:{" "}
                                                        {order.customerName}
                                                    </p>
                                                    {order.notes && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            備考: {order.notes}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mb-4">
                                                    <h4 className="font-medium mb-2">
                                                        注文内容:
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {order.items.map(
                                                            (item, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex justify-between text-sm"
                                                                >
                                                                    <span>
                                                                        {
                                                                            item.menuItemName
                                                                        }{" "}
                                                                        ×{" "}
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                    </span>
                                                                    <span>
                                                                        ¥
                                                                        {(
                                                                            item.quantity *
                                                                            item.unitPrice
                                                                        ).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <Select
                                                        value={order.status}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            updateOrderStatus(
                                                                order.id,
                                                                value as Order["status"]
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-40">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(
                                                                statusLabels
                                                            ).map(
                                                                ([
                                                                    status,
                                                                    label,
                                                                ]) => (
                                                                    <SelectItem
                                                                        key={
                                                                            status
                                                                        }
                                                                        value={
                                                                            status
                                                                        }
                                                                    >
                                                                        {label}
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* 新規注文作成 */}
                        <TabsContent value="create" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>新規注文作成</CardTitle>
                                    <CardDescription>
                                        新しい注文を手動で登録します
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customerName">
                                            お客様名 *
                                        </Label>
                                        <Input
                                            id="customerName"
                                            placeholder="お客様名を入力"
                                            value={newOrderCustomer}
                                            onChange={(e) =>
                                                setNewOrderCustomer(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="notes">備考</Label>
                                        <Input
                                            id="notes"
                                            placeholder="特別な要望などがあれば入力"
                                            value={newOrderNotes}
                                            onChange={(e) =>
                                                setNewOrderNotes(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>注文アイテム</Label>
                                        <div className="p-4 border rounded-lg">
                                            <p className="text-sm text-gray-500 text-center">
                                                注文アイテムの追加機能は開発中です
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={createOrder}
                                        disabled={
                                            isLoading ||
                                            !newOrderCustomer ||
                                            newOrderItems.length === 0
                                        }
                                        className="w-full"
                                    >
                                        {isLoading ? "作成中..." : "注文を作成"}
                                    </Button>
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
