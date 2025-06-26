import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../[...nextauth]/route";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "メールアドレスが必要です" },
                { status: 400 }
            );
        }

        // セッションのメールアドレスと一致するかチェック
        if (session.user.email !== email) {
            return NextResponse.json(
                { error: "アクセス権限がありません" },
                { status: 403 }
            );
        }

        // ユーザー情報を取得
        const userResponse = await notion.databases.query({
            database_id: NOTION_DATABASE_USERS!,
            filter: {
                property: "Email",
                email: {
                    equals: email,
                },
            },
        });

        if (userResponse.results.length === 0) {
            return NextResponse.json(
                { error: "ユーザー情報が見つかりません" },
                { status: 404 }
            );
        }

        const user = userResponse.results[0] as any;
        const userProps = user.properties;

        return NextResponse.json({
            name: userProps.Name?.title[0]?.text?.content || "",
            email: userProps.Email?.email || "",
            role: userProps.Role?.rich_text[0]?.text?.content || "",
            permission: userProps.Permission?.rich_text[0]?.text?.content || "",
            circle: userProps.circle?.rich_text[0]?.text?.content || "",
            imageUrl: userProps.ImageUrl?.url || "",
            updatedAt: userProps.UpdatedAt?.rich_text[0]?.text?.content || "",
        });
    } catch (error) {
        console.error("ユーザー情報取得エラー:", error);
        return NextResponse.json(
            { error: "ユーザー情報の取得に失敗しました" },
            { status: 500 }
        );
    }
}
