import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_MENUS = process.env.NOTION_DATABASE_MENUS;
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

// メニュー一覧取得 (GET)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // ユーザーの権限チェック
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
        const userPermissions =
            user.properties.Permission?.rich_text[0]?.text.content || "";
        const userRole = user.properties.Role?.rich_text[0]?.text.content || "";

        // 権限チェック
        const hasMenuPermission =
            userRole === "admin" ||
            userPermissions.includes("menu_read") ||
            userPermissions.includes("menu_write");

        if (!hasMenuPermission) {
            return NextResponse.json(
                { error: "メニューを閲覧する権限がありません" },
                { status: 403 }
            );
        }

        // メニュー一覧を取得
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_MENUS!,
            sorts: [
                {
                    property: "menuName",
                    direction: "ascending",
                },
            ],
        });

        const menus = response.results.map((page: any) => {
            const properties = page.properties;
            return {
                id: page.id,
                name: properties.menuName?.title[0]?.text.content || "",
                price: properties.price?.number || 0,
                description:
                    properties.description?.rich_text[0]?.text.content || "",
                additionalInfo:
                    properties.additionalInfo?.rich_text[0]?.text.content || "",
                imagePath:
                    properties.imagePath?.rich_text[0]?.text.content || "",
                soldOut: properties.soldOut?.checkbox || false,
                circle: properties.circle?.relation?.[0]?.id || "",
            };
        });

        return NextResponse.json(menus);
    } catch (error) {
        console.error("メニュー取得エラー:", error);
        return NextResponse.json(
            { error: "メニューの取得に失敗しました" },
            { status: 500 }
        );
    }
}

// メニュー作成 (POST)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // ユーザーの権限チェック
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
        const userPermissions =
            user.properties.Permission?.rich_text[0]?.text.content || "";
        const userRole = user.properties.Role?.rich_text[0]?.text.content || "";

        // 権限チェック
        const hasMenuWritePermission =
            userRole === "admin" || userPermissions.includes("menu_write");

        if (!hasMenuWritePermission) {
            return NextResponse.json(
                { error: "メニューを作成する権限がありません" },
                { status: 403 }
            );
        }

        const {
            name,
            price,
            description,
            additionalInfo,
            imagePath,
            circleId,
        } = await req.json();

        if (!name || !price) {
            return NextResponse.json(
                { error: "メニュー名と価格は必須です" },
                { status: 400 }
            );
        }

        // 新しいメニューを作成
        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_MENUS! },
            properties: {
                menuName: {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                price: {
                    number: parseInt(price),
                },
                description: {
                    rich_text: [
                        {
                            text: {
                                content: description || "",
                            },
                        },
                    ],
                },
                additionalInfo: {
                    rich_text: [
                        {
                            text: {
                                content: additionalInfo || "",
                            },
                        },
                    ],
                },
                imagePath: {
                    rich_text: [
                        {
                            text: {
                                content: imagePath || "",
                            },
                        },
                    ],
                },
                soldOut: {
                    checkbox: false,
                },
                ...(circleId && {
                    circle: {
                        relation: [{ id: circleId }],
                    },
                }),
            },
        });

        return NextResponse.json({
            id: response.id,
            name,
            price: parseInt(price),
            description: description || "",
            additionalInfo: additionalInfo || "",
            imagePath: imagePath || "",
            soldOut: false,
            message: "メニューを作成しました",
        });
    } catch (error) {
        console.error("メニュー作成エラー:", error);
        return NextResponse.json(
            { error: "メニューの作成に失敗しました" },
            { status: 500 }
        );
    }
}
