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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePermissionCheck } from "@/hooks/usePermissionCheck";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    circle: string;
    lastLogin?: string;
    isActive: boolean;
}

const ROLE_OPTIONS = [
    { value: "admin", label: "管理者" },
    { value: "manager", label: "マネージャー" },
    { value: "staff", label: "スタッフ" },
    { value: "volunteer", label: "ボランティア" },
    { value: "custom", label: "カスタム" },
];

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const { isAdmin, isManager } = usePermissionCheck();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            // モックデータ
            const mockUsers: User[] = [
                {
                    id: "1",
                    name: "田中太郎",
                    email: "tanaka@example.com",
                    role: "admin",
                    permissions: Object.values(PERMISSIONS),
                    circle: "サークルA",
                    lastLogin: "2024-01-15T10:30:00Z",
                    isActive: true,
                },
                {
                    id: "2",
                    name: "佐藤花子",
                    email: "sato@example.com",
                    role: "manager",
                    permissions: [
                        PERMISSIONS.DASHBOARD_VIEW,
                        PERMISSIONS.MENU_READ,
                        PERMISSIONS.MENU_WRITE,
                        PERMISSIONS.ORDER_READ,
                        PERMISSIONS.ORDER_WRITE,
                        PERMISSIONS.SALES_READ,
                    ],
                    circle: "サークルA",
                    lastLogin: "2024-01-14T15:20:00Z",
                    isActive: true,
                },
            ];
            setUsers(mockUsers);
        } catch (error) {
            setError("ユーザー情報の読み込みに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserRole = async (userId: string, role: string) => {
        try {
            setUsers(
                users.map((user) =>
                    user.id === userId ? { ...user, role } : user
                )
            );
            setSuccess("ロールを更新しました");
        } catch (error) {
            setError("ロールの更新に失敗しました");
        }
    };

    const toggleUserStatus = async (userId: string) => {
        try {
            setUsers(
                users.map((user) =>
                    user.id === userId
                        ? { ...user, isActive: !user.isActive }
                        : user
                )
            );
            setSuccess("ユーザーステータスを更新しました");
        } catch (error) {
            setError("ステータスの更新に失敗しました");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("ja-JP");
    };

    return (
        <PermissionGuard
            requiredPermissions={[PERMISSIONS.USER_READ]}
            customErrorMessage="ユーザー管理機能にアクセスするにはユーザー閲覧権限が必要です。"
        >
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-3xl font-bold mb-2">
                            ユーザー管理
                        </h1>
                        <p className="text-gray-600">
                            ユーザーアカウントと権限を管理します
                        </p>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>登録ユーザー</CardTitle>
                            <CardDescription>
                                システムに登録されているユーザーの一覧
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="font-semibold">
                                                    {user.name}
                                                </h3>
                                                <Badge
                                                    variant={
                                                        user.isActive
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {user.isActive
                                                        ? "有効"
                                                        : "無効"}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {ROLE_OPTIONS.find(
                                                        (r) =>
                                                            r.value ===
                                                            user.role
                                                    )?.label || user.role}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {user.email} | {user.circle}
                                            </p>
                                            {user.lastLogin && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    最終ログイン:{" "}
                                                    {formatDate(user.lastLogin)}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                権限数:{" "}
                                                {user.permissions.length}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            {(isManager() || isAdmin()) && (
                                                <>
                                                    <Select
                                                        value={user.role}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            updateUserRole(
                                                                user.id,
                                                                value
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {ROLE_OPTIONS.map(
                                                                (role) => (
                                                                    <SelectItem
                                                                        key={
                                                                            role.value
                                                                        }
                                                                        value={
                                                                            role.value
                                                                        }
                                                                    >
                                                                        {
                                                                            role.label
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            toggleUserStatus(
                                                                user.id
                                                            )
                                                        }
                                                    >
                                                        {user.isActive
                                                            ? "無効化"
                                                            : "有効化"}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

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
