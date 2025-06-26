import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../auth/[...nextauth]/route";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const NOTION_DATABASE_CIRCLE_INVITES =
    process.env.NOTION_DATABASE_CIRCLE_INVITES;
const NOTION_DATABASE_USERS = process.env.NOTION_DATABASE_USERS;

// 招待コードでサークルに参加
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "認証が必要です" },
                { status: 401 }
            );
        }

        const { inviteCode } = await req.json();

        if (!inviteCode || !inviteCode.trim()) {
            return NextResponse.json(
                { error: "招待コードを入力してください" },
                { status: 400 }
            );
        }

        // 招待コードの検証
        const inviteResponse = await notion.databases.query({
            database_id: NOTION_DATABASE_CIRCLE_INVITES!,
            filter: {
                and: [
                    {
                        property: "名前",
                        title: {
                            equals: inviteCode.trim().toUpperCase(),
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
        });

        if (inviteResponse.results.length === 0) {
            return NextResponse.json(
                { error: "無効な招待コードです" },
                { status: 404 }
            );
        }

        const invite = inviteResponse.results[0] as any;
        const inviteProps = invite.properties;

        // 有効期限チェック
        const expiresAt = new Date(
            inviteProps.ExpiresAt.rich_text[0]?.text.content || ""
        );
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { error: "招待コードの有効期限が切れています" },
                { status: 400 }
            );
        }

        // 使用回数チェック
        const maxUses = inviteProps.MaxUses.number || 0;
        const usedCount = inviteProps.UsedCount.number || 0;
        if (usedCount >= maxUses) {
            return NextResponse.json(
                { error: "招待コードの使用回数が上限に達しています" },
                { status: 400 }
            );
        }

        const circleId = inviteProps.CircleId.rich_text[0]?.text.content || "";
        const assignedRole =
            inviteProps.Role.rich_text[0]?.text.content || "staff";
        const customPermission =
            inviteProps.Permission?.rich_text[0]?.text.content || "";

        // サークル情報取得
        const circleResponse = await notion.pages.retrieve({
            page_id: circleId,
        });
        const circleProps = (circleResponse as any).properties;
        const circleName = circleProps.circleName?.title[0]?.text.content || "";

        // ユーザー情報更新
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

        // ユーザーのサークルと役職を更新
        const updateProperties: any = {
            circle: {
                rich_text: [{ text: { content: circleName } }],
            },
            Role: {
                rich_text: [{ text: { content: assignedRole } }],
            },
            UpdatedAt: {
                rich_text: [{ text: { content: new Date().toISOString() } }],
            },
        };

        // Customロールの場合、招待で指定されたPermissionをユーザーのPermissionフィールドに設定
        if (assignedRole === "custom" && customPermission) {
            updateProperties.Permission = {
                rich_text: [{ text: { content: customPermission } }],
            };
        } else if (!["custom"].includes(assignedRole)) {
            // Custom以外のロールの場合、ロール名をPermissionにも設定
            updateProperties.Permission = {
                rich_text: [{ text: { content: assignedRole } }],
            };
        }

        await notion.pages.update({
            page_id: user.id,
            properties: updateProperties,
        });

        // 管理者ロールの場合はサークルのOwnersに追加
        if (["admin", "manager"].includes(assignedRole)) {
            try {
                // 現在のサークル情報を取得
                const currentCircleData = circleResponse as any;
                const currentOwners =
                    currentCircleData.properties.Owners?.rich_text[0]?.text
                        .content || "";

                // ユーザー名を取得
                const userName =
                    user.properties.Name?.title[0]?.text.content ||
                    session.user.name ||
                    "";

                // 既存のオーナーリストにユーザー名を追加（重複チェック）
                let updatedOwners = currentOwners;
                if (currentOwners && !currentOwners.includes(userName)) {
                    updatedOwners = currentOwners + "," + userName;
                } else if (!currentOwners) {
                    updatedOwners = userName;
                }

                // サークルのOwnersプロパティを更新
                await notion.pages.update({
                    page_id: circleId,
                    properties: {
                        Owners: {
                            rich_text: [
                                {
                                    text: {
                                        content: updatedOwners,
                                    },
                                },
                            ],
                        },
                    },
                });
            } catch (ownersUpdateError) {
                console.error("Ownersプロパティ更新エラー:", ownersUpdateError);
                // エラーが発生してもサークル参加は継続
            }
        }

        // 招待の使用回数を更新
        await notion.pages.update({
            page_id: invite.id,
            properties: {
                UsedCount: {
                    number: usedCount + 1,
                },
            },
        });

        // 招待コードレコードのUsernameプロパティを更新（参加成功時）
        try {
            const userId = user.id;

            await notion.pages.update({
                page_id: invite.id,
                properties: {
                    Username: {
                        rich_text: [
                            {
                                text: {
                                    content: userId, // ユーザーIDを記録
                                },
                            },
                        ],
                    },
                },
            });
        } catch (trackingError) {
            // 記録に失敗してもサークル参加は継続
            console.error("招待リンク使用記録エラー:", trackingError);
        }

        return NextResponse.json({
            success: true,
            circle: {
                id: circleId,
                name: circleName,
            },
            role: assignedRole,
            message: `${circleName}に${assignedRole}として参加しました`,
        });
    } catch (error) {
        console.error("サークル参加エラー:", error);
        return NextResponse.json(
            { error: "サークルへの参加に失敗しました" },
            { status: 500 }
        );
    }
}

// 招待コード情報取得（参加前のプレビュー）
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const inviteCode = searchParams.get("code");

        if (!inviteCode) {
            return NextResponse.json(
                { error: "招待コードが必要です" },
                { status: 400 }
            );
        }

        // セッション情報を取得（ログインしていなくてもプレビューは表示）
        const session = await getServerSession(authOptions);
        const userEmail = session?.user?.email;

        // 招待コードの検証
        const inviteResponse = await notion.databases.query({
            database_id: NOTION_DATABASE_CIRCLE_INVITES!,
            filter: {
                and: [
                    {
                        property: "名前",
                        title: {
                            equals: inviteCode.trim().toUpperCase(),
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
        });

        if (inviteResponse.results.length === 0) {
            return NextResponse.json(
                { error: "無効な招待コードです" },
                { status: 404 }
            );
        }

        const invite = inviteResponse.results[0] as any;
        const inviteProps = invite.properties;

        // 有効期限チェック
        const expiresAt = new Date(
            inviteProps.ExpiresAt.rich_text[0]?.text.content || ""
        );
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { error: "招待コードの有効期限が切れています" },
                { status: 400 }
            );
        }

        const circleId = inviteProps.CircleId.rich_text[0]?.text.content || "";
        const assignedRole =
            inviteProps.Role.rich_text[0]?.text.content || "staff";
        const customPermission =
            inviteProps.Permission?.rich_text[0]?.text.content || "";

        // サークル情報取得
        const circleResponse = await notion.pages.retrieve({
            page_id: circleId,
        });
        const circleProps = (circleResponse as any).properties;
        const circleName = circleProps.circleName?.title[0]?.text.content || "";

        // ログインしているユーザーの場合、招待リンクアクセスを記録
        if (userEmail) {
            try {
                // ユーザー情報を取得
                const userResponse = await notion.databases.query({
                    database_id: NOTION_DATABASE_USERS!,
                    filter: {
                        property: "Email",
                        email: {
                            equals: userEmail,
                        },
                    },
                });

                if (userResponse.results.length > 0) {
                    const user = userResponse.results[0] as any;
                    const userId = user.id;
                    const userName =
                        user.properties.Username?.rich_text[0]?.text.content ||
                        userEmail;

                    // 招待コードレコードのUsernameプロパティを更新
                    await notion.pages.update({
                        page_id: invite.id,
                        properties: {
                            Username: {
                                rich_text: [
                                    {
                                        text: {
                                            content: userId, // ユーザーIDを記録
                                        },
                                    },
                                ],
                            },
                        },
                    });
                }
            } catch (trackingError) {
                // 記録に失敗してもプレビューは継続
                console.error("招待リンクアクセス記録エラー:", trackingError);
            }
        }

        return NextResponse.json({
            circle: {
                id: circleId,
                name: circleName,
            },
            role: assignedRole,
            permission: customPermission,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("招待情報取得エラー:", error);
        return NextResponse.json(
            { error: "招待情報の取得に失敗しました" },
            { status: 500 }
        );
    }
}
