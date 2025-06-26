import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { Circle } from "@/types/interfaces";

import { authOptions } from "../auth/[...nextauth]/route";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_CIRCLES = process.env.NOTION_DATABASE_CIRCLES;
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";
        const myCircles = searchParams.get("my") === "true";

        // 認証チェック
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // ユーザー情報を取得してProviderAccountIdを確認
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
        const userProviderAccountId =
            user.properties.ProviderAccountId?.rich_text[0]?.text.content || "";
        const userName =
            user.properties.Name?.title[0]?.text.content ||
            session.user.name ||
            "";

        // 削除: 全てのログインユーザーがサークルを閲覧できるようにする

        let filter: any = undefined;

        if (query) {
            // 検索クエリがある場合
            filter = {
                property: "circleName",
                title: {
                    contains: query,
                },
            };
        }

        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_CIRCLES!,
            filter,
            sorts: [
                {
                    property: "circleName",
                    direction: "ascending",
                },
            ],
        });

        // 全てのサークルを取得してから、Ownersプロパティで自分のものをフィルタリング
        const allCircles: Circle[] = response.results.map((page: any) => {
            const properties = page.properties;
            return {
                id: page.id,
                name: properties.circleName.title[0]?.text.content || "",
                description:
                    properties.description?.rich_text[0]?.text.content || "",
                iconImagePath: properties.iconImagePath?.url || "",
                backgroundImagePath: properties.backgroundImagePath?.url || "",
                owners: properties.Owners?.rich_text[0]?.text.content || "",
            };
        });

        // Ownersプロパティに自分のユーザー名が含まれているサークルのみをフィルタリング
        const filteredCircles = allCircles.filter(
            (circle) => circle.owners && circle.owners.includes(userName)
        );

        return NextResponse.json(filteredCircles);
    } catch (error) {
        console.error("Error fetching circles:", error);
        return NextResponse.json(
            { error: "サークル一覧の取得に失敗しました" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        // 認証チェック
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
        const userName =
            user.properties.Name?.title[0]?.text.content ||
            session.user.name ||
            "";
        const userProviderAccountId =
            user.properties.ProviderAccountId?.rich_text[0]?.text.content || "";

        // 削除: 全てのログインユーザーがサークルを作成できるようにする

        const { name, description } = await req.json();

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "サークル名は必須です" },
                { status: 400 }
            );
        }

        // 既存のサークルをチェック
        const existingResponse = await notion.databases.query({
            database_id: NOTION_DATABASE_CIRCLES!,
            filter: {
                property: "circleName",
                title: {
                    equals: name.trim(),
                },
            },
        });

        if (existingResponse.results.length > 0) {
            return NextResponse.json(
                { error: "同じ名前のサークルが既に存在します" },
                { status: 400 }
            );
        }

        // 新しいサークルを作成
        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_CIRCLES! },
            properties: {
                circleName: {
                    title: [
                        {
                            text: {
                                content: name.trim(),
                            },
                        },
                    ],
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
                Owners: {
                    rich_text: [
                        {
                            text: {
                                content: userName,
                            },
                        },
                    ],
                },
            },
        });

        // サークル作成者のユーザー情報を管理者として更新
        await notion.pages.update({
            page_id: user.id,
            properties: {
                circle: {
                    rich_text: [{ text: { content: name.trim() } }],
                },
                Role: {
                    rich_text: [{ text: { content: "admin" } }],
                },
                Permission: {
                    rich_text: [{ text: { content: "admin" } }],
                },
                UpdatedAt: {
                    rich_text: [
                        { text: { content: new Date().toISOString() } },
                    ],
                },
            },
        });

        const newCircle: Circle = {
            id: (response as any).id,
            name: name.trim(),
            description: description || "",
            iconImagePath: "",
            backgroundImagePath: "",
            owners: userName,
        };

        return NextResponse.json({
            ...newCircle,
            message: `サークル「${name.trim()}」を作成し、管理者権限を付与しました`,
        });
    } catch (error) {
        console.error("Error creating circle:", error);
        return NextResponse.json(
            { error: "サークルの作成に失敗しました" },
            { status: 500 }
        );
    }
}
