"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { isAuthenticated as isTraditionalAuth, getCircleId } from "@/lib/auth";
import { useAuth, syncSessionWithCookies } from "@/lib/auth-client";

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const {
        session,
        isAuthenticated: isNextAuthAuthenticated,
        isLoading: authLoading,
    } = useAuth();

    useEffect(() => {
        const syncPendingRoleUpdate = async () => {
            // sessionStorageに保存されている未同期のロール情報をチェック
            // 既に同期処理中の場合はスキップ
            if (sessionStorage.getItem("syncInProgress")) {
                return;
            }

            try {
                const pendingUpdate =
                    sessionStorage.getItem("pendingRoleUpdate");
                if (pendingUpdate && session?.user?.email) {
                    const updateData = JSON.parse(pendingUpdate);

                    // 5分以内の更新のみ処理（古いデータは無視）
                    const now = Date.now();
                    const updateAge = now - updateData.timestamp;
                    const fiveMinutes = 5 * 60 * 1000;

                    if (
                        updateAge < fiveMinutes &&
                        updateData.email === session.user.email
                    ) {
                        console.log(
                            "Syncing pending role update to Notion:",
                            updateData
                        );

                        // 同期処理中フラグを設定
                        sessionStorage.setItem("syncInProgress", "true");

                        try {
                            const response = await fetch(
                                "/api/auth/update-user",
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        role: updateData.role,
                                        circle: updateData.circle,
                                        username: updateData.username,
                                    }),
                                }
                            );

                            if (response.ok) {
                                console.log(
                                    "Pending role update synced successfully"
                                );
                                // 同期完了後、sessionStorageから削除
                                sessionStorage.removeItem("pendingRoleUpdate");
                            } else {
                                const errorData = await response
                                    .json()
                                    .catch(() => ({}));
                                console.error(
                                    "Failed to sync pending role update:",
                                    response.status,
                                    errorData
                                );
                            }
                        } catch (syncError) {
                            console.error(
                                "Error syncing pending role update:",
                                syncError
                            );
                        } finally {
                            // 同期処理中フラグを削除
                            sessionStorage.removeItem("syncInProgress");
                        }
                    } else {
                        // 古いデータまたは異なるユーザーのデータは削除
                        sessionStorage.removeItem("pendingRoleUpdate");
                    }
                }
            } catch (error) {
                console.error("Error processing pending role update:", error);
                sessionStorage.removeItem("syncInProgress");
            }
        };

        const checkAuth = async () => {
            // ログインページの場合は認証チェックをスキップ
            if (pathname === "/login") {
                setIsAuth(true);
                setIsLoading(false);
                return;
            }

            // NextAuth.jsによる認証をチェック
            const nextAuthAuth = isNextAuthAuthenticated;

            // 従来の認証をチェック（サークルIDの存在確認）
            const traditionalAuth = isTraditionalAuth();
            const circleId = getCircleId();

            console.log("Auth check:", {
                nextAuthAuth,
                traditionalAuth,
                circleId,
                pathname,
            });

            const authenticated =
                nextAuthAuth || (traditionalAuth && !!circleId);
            setIsAuth(authenticated);

            // NextAuth.jsのセッションがある場合はCookieと同期
            if (session) {
                syncSessionWithCookies(session);
                // sessionStorageの未同期情報もチェック
                await syncPendingRoleUpdate();
            }

            // 認証されていない場合はログインページにリダイレクト
            if (!authenticated && !authLoading) {
                console.log("Redirecting to login: not authenticated");
                router.push("/login");
                return;
            }

            // サークルIDが取得できない場合もログインページにリダイレクト
            if (authenticated && !nextAuthAuth && !circleId) {
                console.log("Redirecting to login: no circle ID");
                router.push("/login");
                return;
            }

            if (!authLoading) {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router, pathname, isNextAuthAuthenticated, session, authLoading]);

    // ログインページの場合は認証ガードをバイパス
    if (pathname === "/login") {
        return <>{children}</>;
    }

    // NextAuth.jsが読み込み中の場合は待機
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <div>認証状態を確認中...</div>
                </div>
            </div>
        );
    }

    // 認証されていない場合は何も表示しない（リダイレクト処理中）
    if (!isAuth) {
        return null;
    }

    return <>{children}</>;
}
