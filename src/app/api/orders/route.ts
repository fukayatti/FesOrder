import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_ORDERS = process.env.NOTION_DATABASE_ORDERS;
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

// 注文一覧取得 (GET)
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
        const hasOrderPermission =
            userRole === "admin" ||
            userPermissions.includes("order_read") ||
            userPermissions.includes("order_write");

        if (!hasOrderPermission) {
            return NextResponse.json(
                { error: "注文を閲覧する権限がありません" },
                { status: 403 }
            );
        }

        // 注文一覧を取得
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_ORDERS!,
            sorts: [
                {
                    property: "time",
                    direction: "descending",
                },
            ],
        });

        const orders = response.results.map((page: any) => {
            const properties = page.properties;
            return {
                id: page.id,
                orderId: properties.orderId?.title[0]?.text.content || "",
                orderItems:
                    properties.orderItems?.rich_text[0]?.text.content || "",
                orderState:
                    properties.orderState?.rich_text[0]?.text.content ||
                    "pending",
                time: properties.time?.date?.start || "",
                totalPrice: properties.totalPrice?.number || 0,
                cashier: properties.cashier?.rich_text[0]?.text.content || "",
                peopleCount: properties.peopleCount?.number || 1,
                circle: properties.circle?.relation?.[0]?.id || "",
            };
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("注文取得エラー:", error);
        return NextResponse.json(
            { error: "注文の取得に失敗しました" },
            { status: 500 }
        );
    }
}

// 注文作成 (POST)
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
        const userName =
            user.properties.Name?.title[0]?.text.content ||
            session.user.name ||
            "";

        // 権限チェック
        const hasOrderWritePermission =
            userRole === "admin" || userPermissions.includes("order_write");

        if (!hasOrderWritePermission) {
            return NextResponse.json(
                { error: "注文を作成する権限がありません" },
                { status: 403 }
            );
        }

        const { orderItems, totalPrice, peopleCount, circleId, notes } =
            await req.json();

        if (!orderItems || !totalPrice) {
            return NextResponse.json(
                { error: "注文内容と合計金額は必須です" },
                { status: 400 }
            );
        }

        // 注文IDを生成
        const orderId = `ORD-${Date.now()}`;

        // 新しい注文を作成
        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_ORDERS! },
            properties: {
                orderId: {
                    title: [
                        {
                            text: {
                                content: orderId,
                            },
                        },
                    ],
                },
                orderItems: {
                    rich_text: [
                        {
                            text: {
                                content: JSON.stringify(orderItems),
                            },
                        },
                    ],
                },
                orderState: {
                    rich_text: [
                        {
                            text: {
                                content: "pending",
                            },
                        },
                    ],
                },
                time: {
                    date: {
                        start: new Date().toISOString(),
                    },
                },
                totalPrice: {
                    number: totalPrice,
                },
                cashier: {
                    rich_text: [
                        {
                            text: {
                                content: userName,
                            },
                        },
                    ],
                },
                peopleCount: {
                    number: peopleCount || 1,
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
            orderId,
            orderItems,
            orderState: "pending",
            totalPrice,
            cashier: userName,
            peopleCount: peopleCount || 1,
            message: "注文を作成しました",
        });
    } catch (error) {
        console.error("注文作成エラー:", error);
        return NextResponse.json(
            { error: "注文の作成に失敗しました" },
            { status: 500 }
        );
    }
}
