import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { Circle } from "@/types/interfaces";
import { authOptions } from "../../auth/[...nextauth]/route";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_CIRCLES = process.env.NOTION_DATABASE_CIRCLES;
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    try {
        // 認証チェック
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // ユーザー情報を取得
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

        // 指定されたユーザーIDでない場合はアクセス禁止
        if (userProviderAccountId !== "c0846ca16b78472c8463aec6cefe3c61") {
            return NextResponse.json(
                { error: "アクセス権限がありません" },
                { status: 403 }
            );
        }

        const response: any = await notion.pages.retrieve({ page_id: id });
        const properties = response.properties;

        const circle: Circle = {
            id: response.id,
            name: properties.circleName.title[0].text.content,
            description: properties.description?.rich_text[0].text.content,
            iconImagePath: properties.iconImagePath?.rich_text[0].text.content,
            backgroundImagePath:
                properties.backgroundImagePath?.rich_text[0].text.content,
            owners: properties.Owners?.rich_text[0]?.text.content || "",
        };

        // サークルのOwnersプロパティに自分が含まれているかチェック
        if (!circle.owners || !circle.owners.includes(userProviderAccountId)) {
            return NextResponse.json(
                { error: "このサークルにアクセスする権限がありません" },
                { status: 403 }
            );
        }

        return NextResponse.json(circle);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "An error occurred while fetching data" },
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

        // ユーザー情報を取得
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

        // 指定されたユーザーIDでない場合はサークル作成を禁止
        if (userProviderAccountId !== "c0846ca16b78472c8463aec6cefe3c61") {
            return NextResponse.json(
                { error: "サークル作成の権限がありません" },
                { status: 403 }
            );
        }

        const {
            name,
            description,
            iconImagePath,
            backgroundImagePath,
            owners,
        } = await req.json();

        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_CIRCLES! },
            properties: {
                circleName: {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                description: {
                    rich_text: [
                        {
                            text: {
                                content: description,
                            },
                        },
                    ],
                },
                iconImagePath: {
                    url: iconImagePath,
                },
                backgroundImagePath: {
                    url: backgroundImagePath,
                },
                Owners: {
                    rich_text: [
                        {
                            text: {
                                content: owners || userProviderAccountId,
                            },
                        },
                    ],
                },
            },
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "An error occurred while creating data" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    try {
        // 認証チェック
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // ユーザー情報を取得
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

        // 指定されたユーザーIDでない場合は更新を禁止
        if (userProviderAccountId !== "c0846ca16b78472c8463aec6cefe3c61") {
            return NextResponse.json(
                { error: "サークル更新の権限がありません" },
                { status: 403 }
            );
        }

        // サークル情報を取得してOwners権限をチェック
        const circleResponse: any = await notion.pages.retrieve({
            page_id: id,
        });
        const circleProperties = circleResponse.properties;
        const circleOwners =
            circleProperties.Owners?.rich_text[0]?.text.content || "";

        if (!circleOwners || !circleOwners.includes(userProviderAccountId)) {
            return NextResponse.json(
                { error: "このサークルを更新する権限がありません" },
                { status: 403 }
            );
        }

        const {
            name,
            description,
            iconImagePath,
            backgroundImagePath,
            owners,
        } = await req.json();

        const response = await notion.pages.update({
            page_id: id,
            properties: {
                circleName: {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                description: {
                    rich_text: [
                        {
                            text: {
                                content: description,
                            },
                        },
                    ],
                },
                iconImagePath: {
                    url: iconImagePath,
                },
                backgroundImagePath: {
                    url: backgroundImagePath,
                },
                Owners: {
                    rich_text: [
                        {
                            text: {
                                content: owners || circleOwners,
                            },
                        },
                    ],
                },
            },
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "An error occurred while updating data" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    try {
        // 認証チェック
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        // ユーザー情報を取得
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

        // 指定されたユーザーIDでない場合は削除を禁止
        if (userProviderAccountId !== "c0846ca16b78472c8463aec6cefe3c61") {
            return NextResponse.json(
                { error: "サークル削除の権限がありません" },
                { status: 403 }
            );
        }

        // サークル情報を取得してOwners権限をチェック
        const circleResponse: any = await notion.pages.retrieve({
            page_id: id,
        });
        const circleProperties = circleResponse.properties;
        const circleOwners =
            circleProperties.Owners?.rich_text[0]?.text.content || "";

        if (!circleOwners || !circleOwners.includes(userProviderAccountId)) {
            return NextResponse.json(
                { error: "このサークルを削除する権限がありません" },
                { status: 403 }
            );
        }

        await notion.pages.update({
            page_id: id,
            archived: true,
        });

        return NextResponse.json({ message: "Page deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "An error occurred while deleting data" },
            { status: 500 }
        );
    }
}
