"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { Alert } from "@/components/ui/alert";
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
import { useAuth, syncSessionWithCookies } from "@/lib/auth-client";

export default function Login() {
    const [eventName, setEventName] = useState("");
    const [circleName, setCircleName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);

    const router = useRouter();
    const {
        session,
        isAuthenticated,
        signIn,
        isLoading: authLoading,
    } = useAuth();

    // セッション変更時の処理
    useEffect(() => {
        if (session) {
            syncSessionWithCookies(session);
            // 認証済みの場合はダッシュボードにリダイレクト
            router.push("/dashboard");
        }
    }, [session, router]);

    // Google認証でのログイン
    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signIn();
        } catch (error) {
            setError("Google認証に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    // 従来のログイン方式
    const handleTraditionalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventName,
                    circleName,
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // 新しい認証関数を使用してクッキーに保存
                const { setAuthCookies } = await import("@/lib/auth");
                setAuthCookies(data.circleId, data.circleName, data.eventName);

                // ダッシュボードにリダイレクト
                router.push("/dashboard");
            } else {
                setError(data.error || "ログインに失敗しました");
            }
        } catch (error) {
            setError("ネットワークエラーが発生しました");
        } finally {
            setIsLoading(false);
        }
    };

    // 認証中の場合はローディング表示
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p>認証状態を確認中...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">
                        ログイン
                    </CardTitle>
                    <CardDescription>
                        Google
                        アカウントでログインするか、従来の方式でログインしてください
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Google認証ボタン */}
                    <Button
                        onClick={handleGoogleSignIn}
                        className="w-full"
                        variant="outline"
                        disabled={isLoading}
                    >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {isLoading ? "ログイン中..." : "Google でログイン"}
                    </Button>

                    {/* 区切り線 */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">
                                または
                            </span>
                        </div>
                    </div>

                    {/* 従来のログイン方式切り替えボタン */}
                    <Button
                        onClick={() =>
                            setShowTraditionalLogin(!showTraditionalLogin)
                        }
                        variant="ghost"
                        className="w-full"
                    >
                        {showTraditionalLogin
                            ? "従来のログインを隠す"
                            : "従来のログインを表示"}
                    </Button>

                    {/* 従来のログインフォーム */}
                    {showTraditionalLogin && (
                        <form
                            onSubmit={handleTraditionalSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="eventName">イベント名</Label>
                                <Input
                                    id="eventName"
                                    type="text"
                                    value={eventName}
                                    onChange={(e) =>
                                        setEventName(e.target.value)
                                    }
                                    required
                                    placeholder="例: 学園祭2024"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="circleName">サークル名</Label>
                                <Input
                                    id="circleName"
                                    type="text"
                                    value={circleName}
                                    onChange={(e) =>
                                        setCircleName(e.target.value)
                                    }
                                    required
                                    placeholder="例: 料理研究会"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">パスワード</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    placeholder="パスワードを入力"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? "ログイン中..." : "従来のログイン"}
                            </Button>
                        </form>
                    )}

                    {error && <Alert className="text-red-600">{error}</Alert>}
                </CardContent>
            </Card>
        </div>
    );
}
