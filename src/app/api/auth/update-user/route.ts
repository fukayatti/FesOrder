import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import NotionAdapter from "../../../../lib/adapters/notionAdapter";
import { authOptions } from "../[...nextauth]/route";

export async function POST(request: Request) {
    try {
        // セッション確認
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        const { role, circle, username, permissions, name } =
            await request.json();

        console.log("Received request data:", {
            role,
            circle,
            username,
            permissions,
            name,
        });

        // ユーザー名のみの更新の場合
        if (name && !role && !circle && !username && !permissions) {
            const adapter = NotionAdapter();
            if (!adapter.updateUser) {
                throw new Error("updateUser method not available");
            }

            const updatedUser = await adapter.updateUser({
                id: (session.user as any).id || session.user.email!,
                email: session.user.email!,
                name: name,
            } as any);

            return NextResponse.json({
                success: true,
                user: updatedUser,
            });
        }

        // 従来の役職・サークル更新の場合
        if (!role || !circle || !username) {
            return NextResponse.json(
                { error: "必要な情報が不足しています" },
                { status: 400 }
            );
        }

        console.log("Updating user with:", {
            role,
            circle,
            username,
            permissions,
            email: session.user.email,
        });

        // Notionアダプターを使用してユーザー情報を更新
        const adapter = NotionAdapter();
        if (!adapter.updateUser) {
            throw new Error("updateUser method not available");
        }

        const updatedUser = await adapter.updateUser({
            id: (session.user as any).id || session.user.email!,
            email: session.user.email!,
            name: username,
            role: role,
            circle: circle,
            permissions: permissions,
        } as any);

        console.log("User updated successfully:", updatedUser);

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            {
                error: "ユーザー情報の更新に失敗しました",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
