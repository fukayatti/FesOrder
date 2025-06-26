"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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

export default function SetupUsernamePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "loading") return;
        if (!session?.user) {
            router.push("/login");
            return;
        }

        // 既にユーザー名が設定されているかチェック
        checkUserProfile();
    }, [session, status]);

    const checkUserProfile = async () => {
        if (!session?.user?.email) return;

        try {
            const response = await fetch(
                `/api/auth/user?email=${session.user.email}`
            );
            if (response.ok) {
                const user = await response.json();
                if (user.name && user.name.trim()) {
                    // 既存のユーザー名を初期値として設定
                    setUsername(user.name);
                }
            }
        } catch (error) {
            console.error("ユーザー情報確認エラー:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) {
            setError("ユーザー名を入力してください");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/update-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: username.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // 成功時はマイページへリダイレクト
                router.push("/user/me");
            } else {
                setError(data.error || "ユーザー名の設定に失敗しました");
            }
        } catch (error) {
            setError("ユーザー名の設定に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">読み込み中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            ユーザー名を設定
                        </CardTitle>
                        <CardDescription>
                            アプリを使用するためにユーザー名を設定してください
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">ユーザー名</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="ユーザー名を入力してください"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading || !username.trim()}
                            >
                                {isLoading ? "設定中..." : "ユーザー名を設定"}
                            </Button>
                        </form>

                        <div className="mt-4 text-center text-sm text-gray-600">
                            <p>メールアドレス: {session?.user?.email}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
