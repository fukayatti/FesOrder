import { NextRequest, NextResponse } from "next/server";

/**
 * サークル認証API
 * イベント名、サークル名、パスワードからサークルIDを取得
 */
export async function POST(request: NextRequest) {
    try {
        const { eventName, circleName, password } = await request.json();

        // 入力値の検証
        if (!eventName || !circleName || !password) {
            return NextResponse.json(
                {
                    error: "すべてのフィールドを入力してください",
                    details: {
                        eventName: !eventName ? "イベント名が必要です" : null,
                        circleName: !circleName ? "サークル名が必要です" : null,
                        password: !password ? "パスワードが必要です" : null,
                    },
                },
                { status: 400 }
            );
        }

        // 文字列の正規化
        const normalizedEventName = eventName.trim();
        const normalizedCircleName = circleName.trim();
        const normalizedPassword = password.trim();

        // イベント名とサークル名からサークル情報を取得
        const eventResponse = await fetch(
            `${request.nextUrl.origin}/api/event/${encodeURIComponent(
                normalizedEventName
            )}`
        );

        if (!eventResponse.ok) {
            console.error(`Event not found: ${normalizedEventName}`);
            return NextResponse.json(
                { error: "指定されたイベントが見つかりません" },
                { status: 404 }
            );
        }

        const eventData = await eventResponse.json();

        // サークル名でサークルを検索（大文字小文字を区別しない）
        const circle = eventData.circles?.find(
            (c: any) =>
                c.name.toLowerCase() === normalizedCircleName.toLowerCase()
        );

        if (!circle) {
            console.error(
                `Circle not found: ${normalizedCircleName} in event: ${normalizedEventName}`
            );
            return NextResponse.json(
                { error: "指定されたサークルが見つかりません" },
                { status: 404 }
            );
        }

        // パスワードチェック（現在はサークルIDをパスワードとして使用）
        if (normalizedPassword !== circle.id) {
            console.error(`Invalid password for circle: ${circle.id}`);
            return NextResponse.json(
                { error: "パスワードが正しくありません" },
                { status: 401 }
            );
        }

        // 認証成功 - サークルIDをトークンとして返す
        console.log(`Authentication successful for circle: ${circle.id}`);
        return NextResponse.json({
            success: true,
            circleId: circle.id,
            circleName: circle.name,
            eventName: normalizedEventName,
        });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            {
                error: "サーバーエラーが発生しました",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
