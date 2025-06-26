"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";

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

function JoinCircleContent() {
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const [inviteCode, setInviteCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [previewInfo, setPreviewInfo] = useState<{
        circle: { name: string };
        role: string;
        expiresAt: string;
    } | null>(null);

    const router = useRouter();

    // URLクエリパラメータから招待コードを取得
    useEffect(() => {
        const code = searchParams.get("code");
        if (code) {
            setInviteCode(code.toUpperCase());
            // 自動的にプレビューを取得
            handlePreviewWithCode(code.toUpperCase());
        }
    }, [searchParams]);

    // 招待コードを指定してプレビュー取得
    const handlePreviewWithCode = async (code: string) => {
        if (!code.trim()) {
            setError("招待コードを入力してください");
            return;
        }

        setIsLoading(true);
        setError("");
        setPreviewInfo(null);

        try {
            const response = await fetch(
                `/api/join?code=${encodeURIComponent(code.trim())}`
            );
            const data = await response.json();

            if (response.ok) {
                setPreviewInfo(data);
            } else {
                setError(data.error || "招待コードの確認に失敗しました");
            }
        } catch (error) {
            setError("招待コードの確認に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    // 招待コードのプレビュー取得
    const handlePreview = async () => {
        await handlePreviewWithCode(inviteCode);
    };

    // サークルに参加
    const handleJoin = async () => {
        if (!session?.user) {
            router.push("/login");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inviteCode: inviteCode.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // 成功時はダッシュボードにリダイレクト
                router.push("/dashboard");
            } else {
                setError(data.error || "サークルへの参加に失敗しました");
            }
        } catch (error) {
            setError("サークルへの参加に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p>読み込み中...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        サークルに参加
                    </CardTitle>
                    <CardDescription>
                        招待コードを入力してサークルに参加してください
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="inviteCode">招待コード</Label>
                        <div className="flex space-x-2">
                            <Input
                                id="inviteCode"
                                type="text"
                                value={inviteCode}
                                onChange={(e) =>
                                    setInviteCode(e.target.value.toUpperCase())
                                }
                                placeholder="ABCD1234"
                                className="text-center font-mono text-lg tracking-widest"
                                maxLength={8}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePreview}
                                disabled={isLoading || !inviteCode.trim()}
                            >
                                確認
                            </Button>
                        </div>
                    </div>

                    {previewInfo && (
                        <Card className="bg-green-50 border-green-200">
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            サークル:
                                        </span>
                                        <span>{previewInfo.circle.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            役職:
                                        </span>
                                        <Badge variant="secondary">
                                            {previewInfo.role}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">
                                            有効期限:
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {new Date(
                                                previewInfo.expiresAt
                                            ).toLocaleString("ja-JP")}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {!session?.user ? (
                        <div className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    サークルに参加するにはログインが必要です
                                </AlertDescription>
                            </Alert>
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full"
                            >
                                ログインページへ
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleJoin}
                            disabled={isLoading || !previewInfo}
                            className="w-full"
                        >
                            {isLoading ? "参加中..." : "サークルに参加"}
                        </Button>
                    )}

                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            招待コードをお持ちでない場合は、
                            <br />
                            サークルの管理者にお問い合わせください
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function JoinCirclePage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex items-center justify-center p-6">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                <p>読み込み中...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <JoinCircleContent />
        </Suspense>
    );
}
