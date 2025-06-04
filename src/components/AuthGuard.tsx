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
        const checkAuth = () => {
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
