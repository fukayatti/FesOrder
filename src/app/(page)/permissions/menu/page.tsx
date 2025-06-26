"use client";

import { useState, useEffect } from "react";

import PermissionGuard from "@/components/PermissionGuard";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MenuItem {
    id: string;
    name: string;
    price: number;
    description: string;
    category: string;
    available: boolean;
}

export default function MenuManagementPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 新しいメニューアイテム用
    const [newItemName, setNewItemName] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("");
    const [newItemDescription, setNewItemDescription] = useState("");
    const [newItemCategory, setNewItemCategory] = useState("");

    useEffect(() => {
        loadMenuItems();
    }, []);

    const loadMenuItems = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/menus");
            if (response.ok) {
                const menus = await response.json();
                const menuItems: MenuItem[] = menus.map((menu: any) => ({
                    id: menu.id,
                    name: menu.name,
                    price: menu.price,
                    description: menu.description,
                    category: menu.additionalInfo || "その他",
                    available: !menu.soldOut,
                }));
                setMenuItems(menuItems);
            } else {
                const errorData = await response.json();
                setError(errorData.error || "メニューの読み込みに失敗しました");
            }
        } catch (error) {
            setError("メニューの読み込みに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const addMenuItem = async () => {
        if (!newItemName || !newItemPrice || !newItemCategory) {
            setError("必須項目を入力してください");
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("/api/menus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newItemName,
                    price: newItemPrice,
                    description: newItemDescription,
                    additionalInfo: newItemCategory,
                }),
            });

            if (response.ok) {
                setNewItemName("");
                setNewItemPrice("");
                setNewItemDescription("");
                setNewItemCategory("");
                setSuccess("メニューアイテムを追加しました");
                await loadMenuItems(); // メニューリストを再読み込み
            } else {
                const errorData = await response.json();
                setError(
                    errorData.error || "メニューアイテムの追加に失敗しました"
                );
            }
        } catch (error) {
            setError("メニューアイテムの追加に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAvailability = async (itemId: string) => {
        try {
            const item = menuItems.find((m) => m.id === itemId);
            if (!item) return;

            const response = await fetch(`/api/menus/${itemId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    soldOut: item.available, // 現在利用可能なら売り切れにする
                }),
            });

            if (response.ok) {
                setSuccess("メニューの状態を更新しました");
                await loadMenuItems(); // メニューリストを再読み込み
            } else {
                const errorData = await response.json();
                setError(errorData.error || "メニューの更新に失敗しました");
            }
        } catch (error) {
            setError("メニューの更新に失敗しました");
        }
    };

    return (
        <PermissionGuard
            requiredPermissions={[
                PERMISSIONS.MENU_READ,
                PERMISSIONS.MENU_WRITE,
            ]}
            customErrorMessage="メニュー管理機能にアクセスするにはメニューの読み取りと書き込み権限が必要です。"
        >
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-3xl font-bold mb-2">
                            メニュー管理
                        </h1>
                        <p className="text-gray-600">
                            サークルのメニューを管理します
                        </p>
                    </div>

                    <Tabs defaultValue="list" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list">メニュー一覧</TabsTrigger>
                            <TabsTrigger value="add">メニュー追加</TabsTrigger>
                        </TabsList>

                        {/* メニュー一覧 */}
                        <TabsContent value="list" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>現在のメニュー</CardTitle>
                                    <CardDescription>
                                        登録されているメニューアイテムの一覧
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {menuItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between p-4 border rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold">
                                                            {item.name}
                                                        </h3>
                                                        <Badge
                                                            variant={
                                                                item.available
                                                                    ? "default"
                                                                    : "secondary"
                                                            }
                                                        >
                                                            {item.available
                                                                ? "販売中"
                                                                : "販売停止"}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {item.category}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {item.description}
                                                    </p>
                                                    <p className="text-lg font-bold text-green-600 mt-1">
                                                        ¥{item.price}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            toggleAvailability(
                                                                item.id
                                                            )
                                                        }
                                                    >
                                                        {item.available
                                                            ? "停止"
                                                            : "再開"}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        編集
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* メニュー追加 */}
                        <TabsContent value="add" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>新しいメニューを追加</CardTitle>
                                    <CardDescription>
                                        新しいメニューアイテムを登録します
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="itemName">
                                                メニュー名 *
                                            </Label>
                                            <Input
                                                id="itemName"
                                                placeholder="メニュー名を入力"
                                                value={newItemName}
                                                onChange={(e) =>
                                                    setNewItemName(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="itemPrice">
                                                価格 (円) *
                                            </Label>
                                            <Input
                                                id="itemPrice"
                                                type="number"
                                                placeholder="価格を入力"
                                                value={newItemPrice}
                                                onChange={(e) =>
                                                    setNewItemPrice(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="itemCategory">
                                            カテゴリ *
                                        </Label>
                                        <Input
                                            id="itemCategory"
                                            placeholder="カテゴリを入力"
                                            value={newItemCategory}
                                            onChange={(e) =>
                                                setNewItemCategory(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="itemDescription">
                                            説明
                                        </Label>
                                        <Input
                                            id="itemDescription"
                                            placeholder="メニューの説明を入力"
                                            value={newItemDescription}
                                            onChange={(e) =>
                                                setNewItemDescription(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <Button
                                        onClick={addMenuItem}
                                        disabled={
                                            isLoading ||
                                            !newItemName ||
                                            !newItemPrice ||
                                            !newItemCategory
                                        }
                                        className="w-full"
                                    >
                                        {isLoading
                                            ? "追加中..."
                                            : "メニューを追加"}
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
