"use client";

import { User, Settings, Shield, Calendar, Activity, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

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

interface UserProfile {
    name: string;
    email: string;
    role: string;
    permission: string;
    circle: string;
    profilePicture: string;
    createdAt: string;
}

interface Circle {
    id: string;
    name: string;
    description: string;
    iconImagePath: string;
    backgroundImagePath: string;
    createdBy?: string;
    memberCount?: number;
}

interface CircleStats {
    totalMembers: number;
    activeInvites: number;
    createdAt: string;
}

// 招待可能な役職の定義
const INVITE_ROLES = {
    admin: {
        name: "管理者",
        description: "サークル管理・招待作成権限",
        color: "bg-red-100 text-red-800",
    },
    manager: {
        name: "マネージャー",
        description: "全ての機能にアクセス可能",
        color: "bg-purple-100 text-purple-800",
    },
    staff: {
        name: "スタッフ",
        description: "基本的な運営機能にアクセス可能",
        color: "bg-blue-100 text-blue-800",
    },
    volunteer: {
        name: "ボランティア",
        description: "限定的な運営補助機能にアクセス可能",
        color: "bg-green-100 text-green-800",
    },
    custom: {
        name: "カスタム",
        description: "カスタム権限を設定可能",
        color: "bg-yellow-100 text-yellow-800",
    },
};

// カスタム権限の選択肢
const CUSTOM_PERMISSIONS = {
    menu_read: "メニュー閲覧",
    menu_write: "メニュー編集",
    order_read: "注文閲覧",
    order_write: "注文作成・編集",
    sales_read: "売上閲覧",
    sales_write: "売上管理",
    user_read: "ユーザー情報閲覧",
    user_write: "ユーザー管理",
    invite_create: "招待作成",
    dashboard_access: "ダッシュボードアクセス",
};

interface Invite {
    id: string;
    inviteCode: string;
    role: string;
    maxUses: number;
    usedCount: number;
    expiresAt: string;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
}

export default function MyPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingCircle, setIsCreatingCircle] = useState(false);
    const [isCreatingInvite, setIsCreatingInvite] = useState(false);

    // Message states
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // User data
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [newUserName, setNewUserName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);

    // Circle creation
    const [newCircleName, setNewCircleName] = useState("");
    const [newCircleDescription, setNewCircleDescription] = useState("");

    // Circle management
    const [availableCircles, setAvailableCircles] = useState<Circle[]>([]);
    const [selectedCircle, setSelectedCircle] = useState<string>("");
    const [circleStats, setCircleStats] = useState<Record<string, CircleStats>>(
        {}
    );

    // Invite management
    const [inviteRole, setInviteRole] =
        useState<keyof typeof INVITE_ROLES>("staff");
    const [inviteExpires, setInviteExpires] = useState("24");
    const [inviteMaxUses, setInviteMaxUses] = useState("10");
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        []
    );
    const [activeInvites, setActiveInvites] = useState<Invite[]>([]);

    // Clear messages after 5 seconds
    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError("");
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    useEffect(() => {
        if (status === "loading") return;
        if (!session?.user) {
            router.push("/login");
            return;
        }

        initializeData();
    }, [session, status, router]);

    const initializeData = useCallback(async () => {
        try {
            await Promise.all([loadUserProfile(), loadCircles()]);
        } catch (error) {
            console.error("データ初期化エラー:", error);
            setError("データの読み込みに失敗しました");
        }
    }, []);

    const loadUserProfile = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const user = await response.json();
                setUserProfile(user);
                setNewUserName(user.name || "");
            } else if (response.status === 404) {
                router.push("/setup-username");
            } else {
                throw new Error("ユーザー情報の取得に失敗");
            }
        } catch (error) {
            console.error("ユーザー情報読み込みエラー:", error);
            setError("ユーザー情報の読み込みに失敗しました");
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const updateUserName = async () => {
        if (!newUserName.trim()) {
            setError("ユーザー名を入力してください");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/auth/update-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newUserName.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("ユーザー名を更新しました");
                setIsEditingName(false);
                loadUserProfile();
            } else {
                setError(data.error || "ユーザー名の更新に失敗しました");
            }
        } catch {
            setError("ユーザー名の更新に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const loadCircles = useCallback(async () => {
        try {
            const response = await fetch("/api/circles");
            if (response.ok) {
                const circles = await response.json();
                setAvailableCircles(circles);

                // 各サークルの統計情報も取得（模擬データ）
                const stats: Record<string, CircleStats> = {};
                circles.forEach((circle: Circle) => {
                    stats[circle.id] = {
                        totalMembers: Math.floor(Math.random() * 50) + 1,
                        activeInvites: Math.floor(Math.random() * 5),
                        createdAt: new Date().toISOString(),
                    };
                });
                setCircleStats(stats);
            } else {
                throw new Error("サークル一覧の取得に失敗");
            }
        } catch (error) {
            console.error("サークル読み込みエラー:", error);
            setError("サークル一覧の読み込みに失敗しました");
        }
    }, []);

    const loadInvites = useCallback(async (circleId: string) => {
        if (!circleId) return;

        try {
            const response = await fetch(`/api/circles/${circleId}/invite`);
            if (response.ok) {
                const invites = await response.json();
                setActiveInvites(invites);
            } else {
                throw new Error("招待一覧の取得に失敗");
            }
        } catch (error) {
            console.error("招待読み込みエラー:", error);
            setError("招待一覧の読み込みに失敗しました");
        }
    }, []);

    const createInvite = useCallback(async () => {
        if (!selectedCircle) {
            setError("サークルを選択してください");
            return;
        }

        if (parseInt(inviteExpires) < 1 || parseInt(inviteExpires) > 168) {
            setError("有効期限は1〜168時間の範囲で設定してください");
            return;
        }

        if (parseInt(inviteMaxUses) < 1 || parseInt(inviteMaxUses) > 100) {
            setError("最大使用回数は1〜100回の範囲で設定してください");
            return;
        }

        setIsCreatingInvite(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `/api/circles/${selectedCircle}/invite`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        role: inviteRole,
                        expiresIn: parseInt(inviteExpires),
                        maxUses: parseInt(inviteMaxUses),
                        customPermission:
                            inviteRole === "custom"
                                ? selectedPermissions.join(",")
                                : undefined,
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSuccess(`招待コード「${data.inviteCode}」を作成しました`);
                await loadInvites(selectedCircle);
            } else {
                setError(data.error || "招待コードの作成に失敗しました");
            }
        } catch (error) {
            console.error("招待作成エラー:", error);
            setError("招待コードの作成に失敗しました");
        } finally {
            setIsCreatingInvite(false);
        }
    }, [selectedCircle, inviteRole, inviteExpires, inviteMaxUses, loadInvites]);

    const createCircle = useCallback(async () => {
        const name = newCircleName.trim();
        const description = newCircleDescription.trim();

        if (!name) {
            setError("サークル名を入力してください");
            return;
        }

        if (name.length < 2 || name.length > 50) {
            setError("サークル名は2〜50文字で入力してください");
            return;
        }

        if (description.length > 200) {
            setError("説明は200文字以内で入力してください");
            return;
        }

        setIsCreatingCircle(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/circles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    description,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || "サークルを作成しました");
                setNewCircleName("");
                setNewCircleDescription("");

                // データを再読み込み
                await Promise.all([loadUserProfile(), loadCircles()]);
            } else {
                setError(data.error || "サークルの作成に失敗しました");
            }
        } catch (error) {
            console.error("サークル作成エラー:", error);
            setError("サークルの作成に失敗しました");
        } finally {
            setIsCreatingCircle(false);
        }
    }, [newCircleName, newCircleDescription, loadUserProfile, loadCircles]);

    const copyInviteLink = useCallback(async (inviteCode: string) => {
        try {
            const inviteUrl = `${window.location.origin}/join?code=${inviteCode}`;
            await navigator.clipboard.writeText(inviteUrl);
            setSuccess("招待リンクをコピーしました");
        } catch (error) {
            console.error("コピーエラー:", error);
            setError("リンクのコピーに失敗しました");
        }
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const isAdmin = userProfile?.role === "admin";

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">読み込み中...</div>
            </div>
        );
    }

    if (!session?.user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* ヘッダー */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                            {userProfile?.profilePicture ? (
                                <img
                                    src={userProfile.profilePicture}
                                    alt="プロフィール画像"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <User className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">
                                {userProfile?.name || "ユーザー"}
                            </h1>
                            <p className="text-gray-600">
                                {session.user.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                                <Badge
                                    variant={
                                        isAdmin ? "destructive" : "secondary"
                                    }
                                    className="flex items-center space-x-1"
                                >
                                    <Shield className="w-3 h-3" />
                                    <span>
                                        {isAdmin ? "管理者" : "一般ユーザー"}
                                    </span>
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="profile">プロフィール</TabsTrigger>
                        <TabsTrigger value="circles">マイサークル</TabsTrigger>
                        <TabsTrigger value="activity">
                            アクティビティ
                        </TabsTrigger>
                        <TabsTrigger value="settings">設定</TabsTrigger>
                    </TabsList>

                    {/* プロフィールタブ */}
                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="w-5 h-5" />
                                    <span>プロフィール情報</span>
                                </CardTitle>
                                <CardDescription>
                                    あなたの基本情報を確認・編集できます
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">ユーザー名</Label>
                                        {isEditingName ? (
                                            <div className="flex space-x-2">
                                                <Input
                                                    id="name"
                                                    value={newUserName}
                                                    onChange={(e) =>
                                                        setNewUserName(
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                />
                                                <Button
                                                    onClick={updateUserName}
                                                    disabled={isLoading}
                                                    size="sm"
                                                >
                                                    保存
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsEditingName(false);
                                                        setNewUserName(
                                                            userProfile?.name ||
                                                                ""
                                                        );
                                                    }}
                                                    size="sm"
                                                >
                                                    キャンセル
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">
                                                    {userProfile?.name ||
                                                        "未設定"}
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setIsEditingName(true)
                                                    }
                                                >
                                                    編集
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label>メールアドレス</Label>
                                        <p className="text-sm font-medium">
                                            {userProfile?.email}
                                        </p>
                                    </div>
                                    <div>
                                        <Label>ロール</Label>
                                        <p className="text-sm font-medium">
                                            {isAdmin
                                                ? "管理者"
                                                : "一般ユーザー"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label>アカウント作成日</Label>
                                        <p className="text-sm font-medium">
                                            {formatDate(
                                                userProfile?.createdAt || ""
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* マイサークルタブ */}
                    <TabsContent value="circles" className="space-y-6">
                        <Tabs defaultValue="create" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="create">
                                    サークル作成
                                </TabsTrigger>
                                <TabsTrigger value="invites">
                                    招待管理
                                </TabsTrigger>
                                <TabsTrigger value="list">
                                    サークル一覧
                                </TabsTrigger>
                            </TabsList>

                            {/* サークル作成 */}
                            <TabsContent value="create" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            新しいサークルを作成
                                        </CardTitle>
                                        <CardDescription>
                                            新しいサークルを作成します。作成者が自動的に管理者になります。
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="circleName">
                                                サークル名 *
                                            </Label>
                                            <Input
                                                id="circleName"
                                                placeholder="サークル名を入力してください"
                                                value={newCircleName}
                                                onChange={(e) =>
                                                    setNewCircleName(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="circleDescription">
                                                説明（任意）
                                            </Label>
                                            <Input
                                                id="circleDescription"
                                                placeholder="サークルの説明を入力してください"
                                                value={newCircleDescription}
                                                onChange={(e) =>
                                                    setNewCircleDescription(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        <Button
                                            onClick={createCircle}
                                            disabled={
                                                isCreatingCircle ||
                                                !newCircleName.trim()
                                            }
                                            className="w-full"
                                        >
                                            {isCreatingCircle
                                                ? "作成中..."
                                                : "サークルを作成"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* 招待管理 */}
                            <TabsContent value="invites" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>招待コード作成</CardTitle>
                                        <CardDescription>
                                            メンバーを招待するための招待コードを作成します
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>対象サークル</Label>
                                            <Select
                                                value={selectedCircle}
                                                onValueChange={(value) => {
                                                    setSelectedCircle(value);
                                                    if (value)
                                                        loadInvites(value);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="サークルを選択してください" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCircles.map(
                                                        (circle) => (
                                                            <SelectItem
                                                                key={circle.id}
                                                                value={
                                                                    circle.id
                                                                }
                                                            >
                                                                {circle.name}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label>付与する役職</Label>
                                                    <Select
                                                        value={inviteRole}
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            setInviteRole(
                                                                value as keyof typeof INVITE_ROLES
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Object.entries(
                                                                INVITE_ROLES
                                                            ).map(
                                                                ([
                                                                    key,
                                                                    role,
                                                                ]) => (
                                                                    <SelectItem
                                                                        key={
                                                                            key
                                                                        }
                                                                        value={
                                                                            key
                                                                        }
                                                                    >
                                                                        {
                                                                            role.name
                                                                        }
                                                                    </SelectItem>
                                                                )
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>
                                                        有効期限 (時間)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        value={inviteExpires}
                                                        onChange={(e) =>
                                                            setInviteExpires(
                                                                e.target.value
                                                            )
                                                        }
                                                        min="1"
                                                        max="168"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>最大使用回数</Label>
                                                    <Input
                                                        type="number"
                                                        value={inviteMaxUses}
                                                        onChange={(e) =>
                                                            setInviteMaxUses(
                                                                e.target.value
                                                            )
                                                        }
                                                        min="1"
                                                        max="100"
                                                    />
                                                </div>
                                            </div>

                                            {inviteRole === "custom" && (
                                                <div className="space-y-3">
                                                    <Label>
                                                        カスタム権限選択
                                                    </Label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {Object.entries(
                                                            CUSTOM_PERMISSIONS
                                                        ).map(
                                                            ([key, label]) => (
                                                                <div
                                                                    key={key}
                                                                    className="flex items-center space-x-2"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`permission-${key}`}
                                                                        checked={selectedPermissions.includes(
                                                                            key
                                                                        )}
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            if (
                                                                                e
                                                                                    .target
                                                                                    .checked
                                                                            ) {
                                                                                setSelectedPermissions(
                                                                                    [
                                                                                        ...selectedPermissions,
                                                                                        key,
                                                                                    ]
                                                                                );
                                                                            } else {
                                                                                setSelectedPermissions(
                                                                                    selectedPermissions.filter(
                                                                                        (
                                                                                            p
                                                                                        ) =>
                                                                                            p !==
                                                                                            key
                                                                                    )
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="rounded border-gray-300"
                                                                    />
                                                                    <label
                                                                        htmlFor={`permission-${key}`}
                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                    >
                                                                        {label}
                                                                    </label>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        付与したい権限を選択してください（複数選択可能）
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            onClick={createInvite}
                                            disabled={
                                                isCreatingInvite ||
                                                !selectedCircle ||
                                                (inviteRole === "custom" &&
                                                    selectedPermissions.length ===
                                                        0)
                                            }
                                            className="w-full"
                                        >
                                            {isCreatingInvite
                                                ? "作成中..."
                                                : "招待コードを作成"}
                                        </Button>
                                    </CardContent>
                                </Card>

                                {activeInvites.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                アクティブな招待コード
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {activeInvites.map((invite) => (
                                                    <div
                                                        key={invite.id}
                                                        className="flex items-center justify-between p-4 border rounded-lg"
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-mono text-lg font-bold">
                                                                    {
                                                                        invite.inviteCode
                                                                    }
                                                                </span>
                                                                <Badge variant="secondary">
                                                                    {INVITE_ROLES[
                                                                        invite.role as keyof typeof INVITE_ROLES
                                                                    ]?.name ||
                                                                        invite.role}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-600">
                                                                使用:{" "}
                                                                {
                                                                    invite.usedCount
                                                                }
                                                                /
                                                                {invite.maxUses}{" "}
                                                                | 期限:{" "}
                                                                {new Date(
                                                                    invite.expiresAt
                                                                ).toLocaleString(
                                                                    "ja-JP"
                                                                )}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                copyInviteLink(
                                                                    invite.inviteCode
                                                                )
                                                            }
                                                            className="flex items-center space-x-1"
                                                        >
                                                            <Copy className="w-4 h-4" />
                                                            <span>コピー</span>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* サークル一覧 */}
                            <TabsContent value="list" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>サークル一覧</CardTitle>
                                        <CardDescription>
                                            既存のサークル一覧を表示します
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {availableCircles.map((circle) => (
                                                <div
                                                    key={circle.id}
                                                    className="flex items-center justify-between p-4 border rounded-lg"
                                                >
                                                    <div>
                                                        <h3 className="font-semibold">
                                                            {circle.name}
                                                        </h3>
                                                        {circle.description && (
                                                            <p className="text-sm text-gray-600">
                                                                {
                                                                    circle.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setSelectedCircle(
                                                                circle.id
                                                            )
                                                        }
                                                    >
                                                        選択
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    {/* アクティビティタブ */}
                    <TabsContent value="activity" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Activity className="w-5 h-5" />
                                    <span>最近のアクティビティ</span>
                                </CardTitle>
                                <CardDescription>
                                    あなたの最近の活動履歴
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>アクティビティはまだありません</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 設定タブ */}
                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Settings className="w-5 h-5" />
                                    <span>設定</span>
                                </CardTitle>
                                <CardDescription>
                                    アカウント設定とプライバシー設定
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">
                                                通知設定
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                メール通知の設定を管理
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            設定
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium">
                                                プライバシー
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                プライバシー設定を管理
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            設定
                                        </Button>
                                    </div>
                                    {isAdmin && (
                                        <>
                                            <hr className="my-4" />
                                            <div className="space-y-4">
                                                <h3 className="font-medium text-lg flex items-center space-x-2">
                                                    <Shield className="w-5 h-5" />
                                                    <span>管理者機能</span>
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium">
                                                            ダッシュボード
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            システム全体の管理画面にアクセス
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(
                                                                "/dashboard"
                                                            )
                                                        }
                                                    >
                                                        開く
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-medium">
                                                            サークル管理
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            詳細なサークル管理ページにアクセス
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(
                                                                "/circle-management"
                                                            )
                                                        }
                                                    >
                                                        開く
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
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
    );
}
