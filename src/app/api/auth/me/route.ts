import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../[...nextauth]/route";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // 現在のユーザーの情報を取得
        const userResponse = await notion.databases.query({
            database_id: NOTION_DATABASE_USERS!,
            filter: {
                property: "Email",
                email: {
                    equals: session.user.email,
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
            profilePicture: userProps.ImageUrl?.url || "",
            createdAt: user.created_time || "",
        });
    } catch (error) {
        console.error("ユーザー情報取得エラー:", error);
        return NextResponse.json(
            { error: "ユーザー情報の取得に失敗しました" },
            { status: 500 }
        );
    }
}
