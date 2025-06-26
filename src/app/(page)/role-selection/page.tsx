"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function RoleSelectionRedirect() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return;

        if (!session?.user) {
            router.push("/login");
            return;
        }

        // セッションから役職をチェック（型安全に）
        const userRole = session.user?.role || session.role || "";

        // 既にサークルに所属している場合はダッシュボードへ
        const userCircle = session.user?.circle || "";

        if (userCircle && userCircle !== "") {
            router.push("/dashboard");
        } else if (["admin", "manager"].includes(userRole)) {
            // 管理者はサークル管理画面へ
            router.push("/setup-username");
        } else {
            // 一般ユーザーは招待コード入力画面またはサークル作成画面へ
            router.push("/setup-username");
        }
    }, [session, status, router]);

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

    // 認証されていない場合の早期リダイレクト表示
    if (!session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center p-6">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                            <p>ログインページにリダイレクト中...</p>
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
                        リダイレクト中...
                    </CardTitle>
                    <CardDescription>
                        適切なページに移動しています
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertDescription>
                            ユーザー権限に基づいて適切なページに移動しています。
                            しばらくお待ちください。
                        </AlertDescription>
                    </Alert>
                    <div className="mt-4 space-y-2">
                        <Button
                            onClick={() => router.push("/join")}
                            className="w-full"
                        >
                            招待コードで参加
                        </Button>
                        <Button
                            onClick={() => router.push("/setup-username")}
                            variant="outline"
                            className="w-full"
                        >
                            サークル管理
                        </Button>
                        <Button
                            onClick={() => router.push("/dashboard")}
                            variant="outline"
                            className="w-full"
                        >
                            ダッシュボード
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
