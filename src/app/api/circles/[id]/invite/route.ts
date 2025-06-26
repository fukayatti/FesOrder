import { Client } from "@notionhq/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../../auth/[...nextauth]/route";

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_CIRCLE_INVITES =
    process.env.NOTION_DATABASE_CIRCLE_INVITES;
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

// 招待コード生成関数
function generateInviteCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 招待コード作成 (POST)
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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
        const userRole = user.properties.Role?.rich_text[0]?.text.content || "";
        const userProviderAccountId =
            user.properties.ProviderAccountId?.rich_text[0]?.text.content || "";

        // 削除: 全てのログインユーザーが招待作成できるようにする

        const { id: circleId } = params;

        // サークル情報を取得してOwnersプロパティをチェック
        const circleResponse: any = await notion.pages.retrieve({
            page_id: circleId,
        });
        const circleProperties = circleResponse.properties;
        const circleOwners =
            circleProperties.Owners?.rich_text[0]?.text.content || "";

        // ユーザー名を取得
        const userName =
            user.properties.Name?.title[0]?.text.content ||
            session.user.name ||
            "";

        // サークルのOwnersプロパティに自分の名前が含まれているかチェック
        if (!circleOwners || !circleOwners.includes(userName)) {
            return NextResponse.json(
                { error: "このサークルの招待コードを作成する権限がありません" },
                { status: 403 }
            );
        }

        // 管理者またはマネージャーのみ招待コード作成可能
        if (!["admin", "manager"].includes(userRole)) {
            return NextResponse.json(
                { error: "招待コードを作成する権限がありません" },
                { status: 403 }
            );
        }

        const { role, expiresIn, maxUses, customPermission } = await req.json();

        // バリデーション
        if (!role || !expiresIn || !maxUses) {
            return NextResponse.json(
                { error: "必要なパラメータが不足しています" },
                { status: 400 }
            );
        }

        // 有効期限を計算
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));

        // 招待コードを生成（重複チェック）
        let inviteCode: string;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            inviteCode = generateInviteCode();

            // 既存の招待コードと重複していないかチェック
            const existingInvites = await notion.databases.query({
                database_id: NOTION_DATABASE_CIRCLE_INVITES!,
                filter: {
                    property: "名前",
                    title: {
                        equals: inviteCode,
                    },
                },
            });

            if (existingInvites.results.length === 0) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return NextResponse.json(
                { error: "招待コードの生成に失敗しました" },
                { status: 500 }
            );
        }

        // Notionに招待情報を保存
        const createProperties: any = {
            名前: {
                title: [
                    {
                        text: {
                            content: inviteCode!,
                        },
                    },
                ],
            },
            CircleId: {
                rich_text: [
                    {
                        text: {
                            content: circleId,
                        },
                    },
                ],
            },
            Role: {
                rich_text: [
                    {
                        text: {
                            content: role,
                        },
                    },
                ],
            },
            MaxUses: {
                number: parseInt(maxUses),
            },
            UsedCount: {
                number: 0,
            },
            ExpiresAt: {
                rich_text: [
                    {
                        text: {
                            content: expiresAt.toISOString(),
                        },
                    },
                ],
            },
            IsActive: {
                checkbox: true,
            },
            CreatedBy: {
                rich_text: [
                    {
                        text: {
                            content: session.user.email || "unknown",
                        },
                    },
                ],
            },
            CreatedAt: {
                date: {
                    start: new Date().toISOString(),
                },
            },
        };

        // Customロールの場合、Permissionフィールドに権限を保存
        if (role === "custom" && customPermission) {
            createProperties.Permission = {
                rich_text: [
                    {
                        text: {
                            content: customPermission,
                        },
                    },
                ],
            };
        }

        const response = await notion.pages.create({
            parent: { database_id: NOTION_DATABASE_CIRCLE_INVITES! },
            properties: createProperties,
        });

        return NextResponse.json({
            inviteCode: inviteCode!,
            id: response.id,
            role,
            maxUses: parseInt(maxUses),
            usedCount: 0,
            expiresAt: expiresAt.toISOString(),
            isActive: true,
        });
    } catch (error) {
        console.error("招待コード作成エラー:", error);
        return NextResponse.json(
            { error: "招待コードの作成に失敗しました" },
            { status: 500 }
        );
    }
}

// アクティブな招待コード一覧取得 (GET)
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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
        const userRole = user.properties.Role?.rich_text[0]?.text.content || "";
        const userProviderAccountId =
            user.properties.ProviderAccountId?.rich_text[0]?.text.content || "";

        // 削除: 全てのログインユーザーが招待閲覧できるようにする

        // 管理者権限チェック
        if (!["admin", "manager"].includes(userRole)) {
            return NextResponse.json(
                { error: "招待コードを閲覧する権限がありません" },
                { status: 403 }
            );
        }

        const { id: circleId } = params;

        // サークル情報を取得してOwnersプロパティをチェック
        const circleResponse: any = await notion.pages.retrieve({
            page_id: circleId,
        });
        const circleProperties = circleResponse.properties;
        const circleOwners =
            circleProperties.Owners?.rich_text[0]?.text.content || "";

        // ユーザー名を取得
        const userName =
            user.properties.Name?.title[0]?.text.content ||
            session.user.name ||
            "";

        // サークルのOwnersプロパティに自分の名前が含まれているかチェック
        if (!circleOwners || !circleOwners.includes(userName)) {
            return NextResponse.json(
                { error: "このサークルの招待コードを閲覧する権限がありません" },
                { status: 403 }
            );
        }

        // 該当サークルのアクティブな招待コードを取得
        const response = await notion.databases.query({
            database_id: NOTION_DATABASE_CIRCLE_INVITES!,
            filter: {
                and: [
                    {
                        property: "CircleId",
                        rich_text: {
                            equals: circleId,
                        },
                    },
                    {
                        property: "IsActive",
                        checkbox: {
                            equals: true,
                        },
                    },
                ],
            },
            sorts: [
                {
                    property: "CreatedAt",
                    direction: "descending",
                },
            ],
        });

        const invites = response.results.map((page: any) => {
            const props = page.properties;
            return {
                id: page.id,
                inviteCode: props["名前"].title[0]?.text.content || "",
                role: props.Role.rich_text[0]?.text.content || "",
                permission: props.Permission?.rich_text[0]?.text.content || "",
                maxUses: props.MaxUses.number || 0,
                usedCount: props.UsedCount.number || 0,
                expiresAt: props.ExpiresAt.rich_text[0]?.text.content || "",
                isActive: props.IsActive.checkbox || false,
                createdBy: props.CreatedBy.rich_text[0]?.text.content || "",
                createdAt: props.CreatedAt.date?.start || "",
            };
        });

        return NextResponse.json(invites);
    } catch (error) {
        console.error("招待コード取得エラー:", error);
        return NextResponse.json(
            { error: "招待コードの取得に失敗しました" },
            { status: 500 }
        );
    }
}
