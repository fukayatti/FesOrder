"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

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

import type { Circle } from "@/types/interfaces";

interface UserProfile {
    name: string;
    email: string;
    role: string;
    permission: string;
    circle: string;
    imageUrl: string;
    updatedAt: string;
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

interface UserPageProps {
    params: {
        userId: string;
    };
}

export default function UserPage({ params }: UserPageProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [availableCircles, setAvailableCircles] = useState<Circle[]>([]);
    const [selectedCircle, setSelectedCircle] = useState<string>("");

    // ユーザー名設定用の状態
    const [newUserName, setNewUserName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);

    // サークル作成用の状態（管理者のみ）
    const [newCircleName, setNewCircleName] = useState("");
    const [newCircleDescription, setNewCircleDescription] = useState("");

    // 招待作成用の状態（管理者のみ）
    const [inviteRole, setInviteRole] =
        useState<keyof typeof INVITE_ROLES>("staff");
    const [inviteExpires, setInviteExpires] = useState("24");
    const [inviteMaxUses, setInviteMaxUses] = useState("10");
    const [activeInvites, setActiveInvites] = useState<Invite[]>([]);

    useEffect(() => {
        if (status === "loading") return;
        if (!session?.user) {
            router.push("/login");
            return;
        }

        // 自分のページかチェック
        const isOwnPage =
            params.userId === session.user.email || params.userId === "me";
        if (!isOwnPage) {
            router.push("/user/me");
            return;
        }

        // ユーザー情報を読み込み
        loadUserProfile();
        // サークル一覧を読み込み
        loadCircles();
    }, [session, status, params.userId]);

    const loadUserProfile = async () => {
        if (!session?.user?.email) return;

        try {
            const response = await fetch(
                `/api/auth/user?email=${session.user.email}`
            );
            if (response.ok) {
                const user = await response.json();
                setUserProfile(user);
                setNewUserName(user.name || "");
            }
        } catch (error) {
            console.error("ユーザー情報読み込みエラー:", error);
        }
    };

    const loadCircles = async () => {
        try {
            const response = await fetch("/api/circles");
            if (response.ok) {
                const circles = await response.json();
                setAvailableCircles(circles);
            }
        } catch {
            console.error("サークル読み込みエラー:");
        }
    };

    const loadInvites = async (circleId: string) => {
        try {
            const response = await fetch(`/api/circles/${circleId}/invite`);
            if (response.ok) {
                const invites = await response.json();
                setActiveInvites(invites);
            }
        } catch {
            console.error("招待読み込みエラー:");
        }
    };

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
        } catch (error) {
            setError("ユーザー名の更新に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const createCircle = async () => {
        if (!newCircleName.trim()) {
            setError("サークル名を入力してください");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/circles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: newCircleName.trim(),
                    description: newCircleDescription.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(`サークル「${data.name}」を作成しました`);
                setNewCircleName("");
                setNewCircleDescription("");
                loadCircles();
            } else {
                setError(data.error || "サークルの作成に失敗しました");
            }
        } catch {
            setError("サークルの作成に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const createInvite = async () => {
        if (!selectedCircle) {
            setError("サークルを選択してください");
            return;
        }

        setIsLoading(true);
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
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                setSuccess(`招待コード「${data.inviteCode}」を作成しました`);
                loadInvites(selectedCircle);
            } else {
                setError(data.error || "招待コードの作成に失敗しました");
            }
        } catch (error) {
            setError("招待コードの作成に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    // 管理者権限チェック
    const isAdmin =
        userProfile?.permission === "admin" || userProfile?.role === "admin";

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">マイページ</h1>
                    <p className="text-gray-600">
                        プロフィール情報の管理を行います
                    </p>
                </div>
                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList
                        className={`grid w-full ${
                            isAdmin ? "grid-cols-4" : "grid-cols-1"
                        }`}
                    >
                        <TabsTrigger value="profile">プロフィール</TabsTrigger>
                        {isAdmin && (
                            <>
                                <TabsTrigger value="create">
                                    サークル作成
                                </TabsTrigger>
                                <TabsTrigger value="invites">
                                    招待管理
                                </TabsTrigger>
                                <TabsTrigger value="circles">
                                    サークル一覧
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>プロフィール情報</CardTitle>
                                <CardDescription>
                                    あなたの基本情報を確認・編集できます
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {userProfile && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>ユーザー名</Label>
                                            {isEditingName ? (
                                                <div className="flex space-x-2">
                                                    <Input
                                                        value={newUserName}
                                                        onChange={(e) =>
                                                            setNewUserName(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="ユーザー名を入力"
                                                    />
                                                    <Button
                                                        onClick={updateUserName}
                                                        disabled={isLoading}
                                                    >
                                                        保存
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setIsEditingName(
                                                                false
                                                            );
                                                            setNewUserName(
                                                                userProfile.name ||
                                                                    ""
                                                            );
                                                        }}
                                                    >
                                                        キャンセル
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="font-medium">
                                                        {userProfile.name ||
                                                            "未設定"}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setIsEditingName(
                                                                true
                                                            )
                                                        }
                                                    >
                                                        編集
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label>メールアドレス</Label>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-700">
                                                    {userProfile.email}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>所属サークル</Label>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <span className="text-gray-700">
                                                    {userProfile.circle ||
                                                        "未所属"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>役職</Label>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <Badge variant="secondary">
                                                    {userProfile.role ||
                                                        "未設定"}
                                                </Badge>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="space-y-2">
                                                <Label>権限レベル</Label>
                                                <div className="p-3 bg-red-50 rounded-lg">
                                                    <Badge variant="destructive">
                                                        管理者
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {isAdmin && (
                        <TabsContent value="create" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>新しいサークルを作成</CardTitle>
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
                                                setNewCircleName(e.target.value)
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
                                            isLoading || !newCircleName.trim()
                                        }
                                        className="w-full"
                                    >
                                        {isLoading
                                            ? "作成中..."
                                            : "サークルを作成"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {isAdmin && (
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
                                                if (value) loadInvites(value);
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
                                                            value={circle.id}
                                                        >
                                                            {circle.name}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>付与する役職</Label>
                                            <Select
                                                value={inviteRole}
                                                onValueChange={(value) =>
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
                                                    ).map(([key, role]) => (
                                                        <SelectItem
                                                            key={key}
                                                            value={key}
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>有効期限 (時間)</Label>
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

                                    <Button
                                        onClick={createInvite}
                                        disabled={isLoading || !selectedCircle}
                                        className="w-full"
                                    >
                                        {isLoading
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
                                                            {invite.usedCount}/
                                                            {invite.maxUses} |
                                                            期限:{" "}
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
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(
                                                                `${window.location.origin}/join?code=${invite.inviteCode}`
                                                            );
                                                            setSuccess(
                                                                "招待リンクをコピーしました"
                                                            );
                                                        }}
                                                    >
                                                        リンクをコピー
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    )}

                    {isAdmin && (
                        <TabsContent value="circles" className="space-y-6">
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
                                                            {circle.description}
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
                    )}
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
