"use client";

import { useSession, signIn, signOut } from "next-auth/react";

import type { Session } from "next-auth";

/**
 * NextAuth.jsセッション管理のカスタムフック
 */
export function useAuth() {
    const { data: session, status } = useSession();

    return {
        session: session as Session | null,
        user: session?.user || null,
        isLoading: status === "loading",
        isAuthenticated: !!session,
        signIn: () => signIn("google"),
        signOut: () => signOut({ callbackUrl: "/login" }),
    };
}

/**
 * NextAuth.jsセッション情報をローカルストレージと同期
 */
export function syncSessionWithCookies(session: Session | null) {
    if (typeof window === "undefined") return;

    if (session?.user) {
        // NextAuthのセッションから既存のCookie形式に変換
        document.cookie = `circleId=${session.user.id}; path=/; max-age=${
            30 * 24 * 60 * 60
        }`;
        document.cookie = `circleName=${encodeURIComponent(
            session.user.name
        )}; path=/; max-age=${30 * 24 * 60 * 60}`;

        // プロバイダー情報も保存
        if (session.provider) {
            document.cookie = `authProvider=${
                session.provider
            }; path=/; max-age=${30 * 24 * 60 * 60}`;
        }
    } else {
        // ログアウト時はCookieをクリア
        document.cookie =
            "circleId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
            "circleName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
            "authProvider=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

/**
 * 認証状態の確認（既存のauth.tsとの互換性）
 */
export function isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;

    // NextAuthのセッション情報があるかチェック
    const cookies = document.cookie.split(";");
    const nextAuthCookie = cookies.find(
        (cookie) =>
            cookie.trim().startsWith("next-auth.session-token=") ||
            cookie.trim().startsWith("__Secure-next-auth.session-token=")
    );

    return !!nextAuthCookie;
}
