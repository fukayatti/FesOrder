"use client";

import type { UserRole, UserSession } from "@/types/interfaces";

/**
 * サークルIDを取得（認証トークンとして使用）
 */
export function getCircleId(): string | null {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";");
    const circleIdCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("circleId=")
    );

    const circleId = circleIdCookie ? circleIdCookie.split("=")[1] : null;
    return circleId && circleId !== "undefined" && circleId !== ""
        ? circleId
        : null;
}

/**
 * サークル名を取得
 */
export function getCircleName(): string | null {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";");
    const circleNameCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("circleName=")
    );

    const circleName = circleNameCookie
        ? decodeURIComponent(circleNameCookie.split("=")[1])
        : null;
    return circleName && circleName !== "undefined" && circleName !== ""
        ? circleName
        : null;
}

/**
 * イベント名を取得
 */
export function getEventName(): string | null {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";");
    const eventNameCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("eventName=")
    );

    const eventName = eventNameCookie
        ? decodeURIComponent(eventNameCookie.split("=")[1])
        : null;
    return eventName && eventName !== "undefined" && eventName !== ""
        ? eventName
        : null;
}

/**
 * ユーザーロールを取得
 */
export function getUserRole(): UserRole | null {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";");
    const roleCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("userRole=")
    );

    return roleCookie ? (roleCookie.split("=")[1] as UserRole) : null;
}

/**
 * ユーザー名を取得
 */
export function getUsername(): string | null {
    if (typeof window === "undefined") return null;

    const cookies = document.cookie.split(";");
    const usernameCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("username=")
    );

    const username = usernameCookie
        ? decodeURIComponent(usernameCookie.split("=")[1])
        : null;
    return username && username !== "undefined" && username !== ""
        ? username
        : null;
}

/**
 * カスタム権限を取得
 */
export function getCustomPermissions(): string[] {
    if (typeof window === "undefined") return [];

    const cookies = document.cookie.split(";");
    const permissionsCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("customPermissions=")
    );

    if (!permissionsCookie) return [];

    try {
        const permissionsString = decodeURIComponent(
            permissionsCookie.split("=")[1]
        );
        return JSON.parse(permissionsString);
    } catch {
        return [];
    }
}

/**
 * 完全なユーザーセッション情報を取得
 */
export function getUserSession(): UserSession | null {
    const circleId = getCircleId();
    const circleName = getCircleName();
    const eventName = getEventName();
    const userRole = getUserRole();
    const username = getUsername();
    const customPermissions = getCustomPermissions();

    if (!circleId || !circleName || !eventName || !userRole || !username) {
        return null;
    }

    return {
        circleId,
        circleName,
        eventName,
        userRole,
        username,
        customPermissions,
    };
}

/**
 * 認証状態を確認（サークルIDとロールの存在をチェック）
 */
export function isAuthenticated(): boolean {
    const circleId = getCircleId();
    const userRole = getUserRole();
    return circleId !== null && circleId.length > 0 && userRole !== null;
}

/**
 * 基本認証状態を確認（サークルIDのみをチェック）
 */
export function isBasicAuthenticated(): boolean {
    const circleId = getCircleId();
    return circleId !== null && circleId.length > 0;
}

/**
 * 認証情報をCookieに保存
 */
export function setAuthCookies(
    circleId: string,
    circleName: string,
    eventName: string
): void {
    if (typeof window === "undefined") return;

    const maxAge = 30 * 24 * 60 * 60; // 30日
    document.cookie = `circleId=${circleId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `circleName=${encodeURIComponent(
        circleName
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `eventName=${encodeURIComponent(
        eventName
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * ユーザーセッション情報をCookieに保存
 */
export function setUserSession(session: UserSession): void {
    if (typeof window === "undefined") return;

    const maxAge = 30 * 24 * 60 * 60; // 30日

    document.cookie = `circleId=${session.circleId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `circleName=${encodeURIComponent(
        session.circleName
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `eventName=${encodeURIComponent(
        session.eventName
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `userRole=${session.userRole}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `username=${encodeURIComponent(
        session.username
    )}; path=/; max-age=${maxAge}; SameSite=Lax`;

    if (session.customPermissions && session.customPermissions.length > 0) {
        document.cookie = `customPermissions=${encodeURIComponent(
            JSON.stringify(session.customPermissions)
        )}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
}

/**
 * ページアクセス権限の定義
 */
const PAGE_PERMISSIONS = {
    "/dashboard": ["manager", "staff", "custom"],
    "/dashboard/menus": ["manager"],
    "/dashboard/sales": ["manager"],
    "/dashboard/orders": ["manager", "staff"],
    "/register": ["manager", "staff"], // レジ
    "/kitchen": ["manager", "staff"], // 厨房
    "/backyard": ["manager"],
} as const;

/**
 * ユーザーがページにアクセス可能かチェック
 */
export function hasPageAccess(page: string): boolean {
    const userRole = getUserRole();
    const customPermissions = getCustomPermissions();

    if (!userRole) return false;

    // managerは全てにアクセス可能
    if (userRole === "manager") return true;

    // 定義されたページ権限をチェック
    const allowedRoles =
        PAGE_PERMISSIONS[page as keyof typeof PAGE_PERMISSIONS];
    if (allowedRoles && allowedRoles.includes(userRole as any)) return true;

    // customロールの場合は個別権限をチェック
    if (userRole === "custom" && customPermissions.includes(page)) return true;

    return false;
}

/**
 * ログアウト処理
 */
export function logout(): void {
    if (typeof window === "undefined") return;

    // 全ての認証関連Cookieをクリア
    document.cookie =
        "circleId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "circleName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "eventName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "customPermissions=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "authProvider=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // ログインページにリダイレクト
    window.location.href = "/login";
}

/**
 * イベント名、サークル名、パスワードからサークルIDを取得
 */
export async function getCircleIdByCredentials(
    eventName: string,
    circleName: string,
    password: string
): Promise<{ success: boolean; circleId?: string; error?: string }> {
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
            return {
                success: true,
                circleId: data.circleId,
            };
        } else {
            return {
                success: false,
                error: data.error || "認証に失敗しました",
            };
        }
    } catch (error) {
        return {
            success: false,
            error: "ネットワークエラーが発生しました",
        };
    }
}
