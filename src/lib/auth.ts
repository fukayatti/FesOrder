"use client";

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
 * 認証状態を確認（サークルIDの存在をチェック）
 */
export function isAuthenticated(): boolean {
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
 * ログアウト処理
 */
export function logout(): void {
    if (typeof window === "undefined") return;

    // Cookieをクリア
    document.cookie =
        "circleId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "circleName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
        "eventName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
