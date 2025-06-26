import { Client } from "@notionhq/client";

import type {
    CreatePageResponse,
    PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type {
    Adapter,
    AdapterUser,
    AdapterAccount,
    AdapterSession,
    VerificationToken,
} from "next-auth/adapters";

// Notion APIクライアントの初期化
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const databaseId = process.env.NOTION_DATABASE_LOGIN!;

type NotionAdapter = {
    name: string;
    email?: string;
    provider?: string;
    providerAccountId?: string;
    image?: string;
    updatedAt?: string;
    role?: string;
    circle?: string;
};

/**
 * NextAuth用 Notion Adapter
 * 直接Notion APIを使用してユーザー情報を保存・取得
 */
export default function NotionAdapter(): Adapter {
    // Notionページからユーザー情報を抽出するヘルパー関数
    const extractUserFromPage = (
        page: PageObjectResponse
    ): AdapterUser | null => {
        try {
            const properties = page.properties;

            const getName = () => {
                const nameProperty = properties.Name;
                if (
                    nameProperty?.type === "title" &&
                    nameProperty.title.length > 0
                ) {
                    return nameProperty.title[0].plain_text;
                }
                return "Unknown User";
            };

            const getEmail = () => {
                const emailProperty = properties.Email;
                if (emailProperty?.type === "email") {
                    return emailProperty.email || "";
                }
                return "";
            };

            const getProviderAccountId = () => {
                const providerAccountIdProperty = properties.ProviderAccountId;
                if (
                    providerAccountIdProperty?.type === "rich_text" &&
                    providerAccountIdProperty.rich_text.length > 0
                ) {
                    return providerAccountIdProperty.rich_text[0].plain_text;
                }
                return "";
            };

            const getImage = () => {
                // ImageUrlプロパティを試す
                const imageUrlProperty = properties.ImageUrl;
                if (imageUrlProperty?.type === "url") {
                    return imageUrlProperty.url;
                }

                // Imageプロパティを試す
                const imageProperty = properties.Image;
                if (imageProperty?.type === "url") {
                    return imageProperty.url;
                }

                // ImageTextプロパティを試す（rich_textとして保存されている場合）
                const imageTextProperty = properties.ImageText;
                if (
                    imageTextProperty?.type === "rich_text" &&
                    imageTextProperty.rich_text.length > 0
                ) {
                    return imageTextProperty.rich_text[0].plain_text;
                }

                return undefined;
            };

            const getRole = () => {
                const roleProperty = properties.Role;
                if (
                    roleProperty?.type === "rich_text" &&
                    roleProperty.rich_text.length > 0
                ) {
                    return roleProperty.rich_text[0].plain_text;
                }
                return undefined;
            };

            const getCircle = () => {
                const circleProperty = properties.circle;
                if (
                    circleProperty?.type === "rich_text" &&
                    circleProperty.rich_text.length > 0
                ) {
                    return circleProperty.rich_text[0].plain_text;
                }
                return undefined;
            };

            const getPermissions = () => {
                const permissionProperty = properties.Permission;
                if (
                    permissionProperty?.type === "rich_text" &&
                    permissionProperty.rich_text.length > 0
                ) {
                    try {
                        const jsonString =
                            permissionProperty.rich_text[0].plain_text;
                        return JSON.parse(jsonString);
                    } catch {
                        return [];
                    }
                }
                return [];
            };

            return {
                id: getProviderAccountId() || page.id,
                name: getName(),
                email: getEmail(),
                image: getImage() || null,
                emailVerified: null,
                // カスタムプロパティを追加
                role: getRole(),
                circle: getCircle(),
                permissions: getPermissions(),
            } as AdapterUser & {
                role?: string;
                circle?: string;
                permissions?: string[];
            };
        } catch (error) {
            console.error("Error extracting user from page:", error);
            return null;
        }
    };

    return {
        /**
         * ユーザー登録
         */
        async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
            try {
                const now = new Date().toISOString();

                // 基本的なプロパティ
                const properties: any = {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: user.name || "Unknown User",
                                },
                            },
                        ],
                    },
                    Email: {
                        email: user.email || "",
                    },
                    Provider: {
                        rich_text: [
                            {
                                text: {
                                    content: "google",
                                },
                            },
                        ],
                    },
                    ProviderAccountId: {
                        rich_text: [
                            {
                                text: {
                                    content:
                                        (user as any).providerAccountId || "",
                                },
                            },
                        ],
                    },
                    Role: {
                        rich_text: [
                            {
                                text: {
                                    content: (user as any).role || "",
                                },
                            },
                        ],
                    },
                    circle: {
                        rich_text: [
                            {
                                text: {
                                    content: (user as any).circle || "",
                                },
                            },
                        ],
                    },
                    Permission: {
                        rich_text: [
                            {
                                text: {
                                    content: JSON.stringify(
                                        (user as any).permissions || []
                                    ),
                                },
                            },
                        ],
                    },
                    UpdatedAt: {
                        rich_text: [
                            {
                                text: {
                                    content: now,
                                },
                            },
                        ],
                    },
                };

                // ImageUrlプロパティが存在する場合のみ追加
                if ((user as any).image) {
                    try {
                        // まずImageUrlプロパティを試す
                        properties.ImageUrl = {
                            url: (user as any).image,
                        };
                    } catch (error) {
                        // ImageUrlプロパティが存在しない場合は、Image プロパティを試す
                        try {
                            properties.Image = {
                                url: (user as any).image,
                            };
                        } catch (error2) {
                            // どちらも失敗した場合は、imageプロパティをrich_textとして保存
                            properties.ImageText = {
                                rich_text: [
                                    {
                                        text: {
                                            content: (user as any).image,
                                        },
                                    },
                                ],
                            };
                        }
                    }
                }

                const response = (await notion.pages.create({
                    parent: { database_id: databaseId },
                    properties,
                })) as CreatePageResponse;

                return {
                    id: response.id,
                    name: user.name || "Unknown User",
                    email: user.email || "",
                    image: user.image || null,
                    emailVerified: user.emailVerified || null,
                    role: (user as any).role,
                    circle: (user as any).circle,
                    permissions: (user as any).permissions,
                } as AdapterUser & {
                    role?: string;
                    circle?: string;
                    permissions?: string[];
                };
            } catch (error) {
                console.error("Error creating user:", error);
                throw error;
            }
        },

        /**
         * ID でユーザー取得
         */
        async getUser(id: string): Promise<AdapterUser | null> {
            try {
                const response = await notion.databases.query({
                    database_id: databaseId,
                    filter: {
                        property: "ProviderAccountId",
                        rich_text: {
                            equals: id,
                        },
                    },
                });

                if (response.results.length === 0) return null;

                const page = response.results[0] as PageObjectResponse;
                return extractUserFromPage(page);
            } catch (error) {
                console.error("Error getting user by ID:", error);
                return null;
            }
        },

        /**
         * Email からユーザー取得
         */
        async getUserByEmail(email: string): Promise<AdapterUser | null> {
            try {
                const response = await notion.databases.query({
                    database_id: databaseId,
                    filter: {
                        property: "Email",
                        email: {
                            equals: email,
                        },
                    },
                });

                if (response.results.length === 0) return null;

                const page = response.results[0] as PageObjectResponse;
                return extractUserFromPage(page);
            } catch (error) {
                console.error("Error getting user by email:", error);
                return null;
            }
        },

        /**
         * プロバイダとアカウント ID からユーザー取得
         */
        async getUserByAccount({
            providerAccountId,
            provider,
        }: {
            providerAccountId: string;
            provider: string;
        }): Promise<AdapterUser | null> {
            try {
                const response = await notion.databases.query({
                    database_id: databaseId,
                    filter: {
                        and: [
                            {
                                property: "Provider",
                                rich_text: {
                                    equals: provider,
                                },
                            },
                            {
                                property: "ProviderAccountId",
                                rich_text: {
                                    equals: providerAccountId,
                                },
                            },
                        ],
                    },
                });

                if (response.results.length === 0) return null;

                const page = response.results[0] as PageObjectResponse;
                return extractUserFromPage(page);
            } catch (error) {
                console.error("Error getting user by account:", error);
                return null;
            }
        },

        /**
         * ユーザー情報更新
         */
        async updateUser(
            user: Partial<AdapterUser> & Pick<AdapterUser, "id">
        ): Promise<AdapterUser> {
            try {
                console.log("updateUser called with:", user);

                // メールアドレスでユーザーを検索してNotionページIDを取得
                const response = await notion.databases.query({
                    database_id: databaseId,
                    filter: {
                        property: "Email",
                        email: {
                            equals: user.email!,
                        },
                    },
                });

                if (response.results.length === 0) {
                    throw new Error("User not found for update");
                }

                const notionPage = response.results[0];
                const notionPageId = notionPage.id;

                console.log("Found Notion page ID:", notionPageId);

                // 既存ユーザー情報を取得
                const existingUser = extractUserFromPage(notionPage as any);
                if (!existingUser) {
                    throw new Error("Could not extract user from page");
                }

                // Notionページを実際に更新
                const updateProperties: any = {};

                if (user.name) {
                    updateProperties.Name = {
                        title: [
                            {
                                text: {
                                    content: user.name,
                                },
                            },
                        ],
                    };
                }

                if ((user as any).role) {
                    updateProperties.Role = {
                        rich_text: [
                            {
                                text: {
                                    content: (user as any).role,
                                },
                            },
                        ],
                    };
                }

                if ((user as any).circle) {
                    updateProperties.circle = {
                        rich_text: [
                            {
                                text: {
                                    content: (user as any).circle,
                                },
                            },
                        ],
                    };
                }

                if ((user as any).permissions) {
                    updateProperties.Permission = {
                        rich_text: [
                            {
                                text: {
                                    content: JSON.stringify(
                                        (user as any).permissions
                                    ),
                                },
                            },
                        ],
                    };
                }

                // UpdatedAtを更新
                updateProperties.UpdatedAt = {
                    rich_text: [
                        {
                            text: {
                                content: new Date().toISOString(),
                            },
                        },
                    ],
                };

                console.log(
                    "Updating Notion page with properties:",
                    updateProperties
                );

                // Notionページを更新
                await notion.pages.update({
                    page_id: notionPageId,
                    properties: updateProperties,
                });

                console.log("Notion page updated successfully");

                // 更新後のユーザー情報を返す
                return {
                    id: existingUser.id,
                    name: user.name || existingUser.name,
                    email: user.email || existingUser.email,
                    image: user.image || existingUser.image,
                    emailVerified:
                        user.emailVerified || existingUser.emailVerified,
                    role: (user as any).role || (existingUser as any).role,
                    circle:
                        (user as any).circle || (existingUser as any).circle,
                    permissions:
                        (user as any).permissions ||
                        (existingUser as any).permissions,
                } as AdapterUser & {
                    role?: string;
                    circle?: string;
                    permissions?: string[];
                };
            } catch (error) {
                console.error("Error updating user:", error);
                if (error instanceof Error) {
                    console.error("Error message:", error.message);
                    console.error("Error stack:", error.stack);
                }
                throw error;
            }
        },

        /**
         * アカウント情報のリンク（OAuth プロバイダ情報を記録）
         */
        async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
            try {
                const now = new Date().toISOString();

                const properties: any = {
                    Name: {
                        title: [
                            {
                                text: {
                                    content: "Account Link",
                                },
                            },
                        ],
                    },
                    Email: {
                        email: null, // 空文字列ではなくnullを設定
                    },
                    Provider: {
                        rich_text: [
                            {
                                text: {
                                    content: account.provider,
                                },
                            },
                        ],
                    },
                    ProviderAccountId: {
                        rich_text: [
                            {
                                text: {
                                    content: account.providerAccountId,
                                },
                            },
                        ],
                    },
                    Role: {
                        rich_text: [
                            {
                                text: {
                                    content: "",
                                },
                            },
                        ],
                    },
                    circle: {
                        rich_text: [
                            {
                                text: {
                                    content: "",
                                },
                            },
                        ],
                    },
                    Permission: {
                        rich_text: [
                            {
                                text: {
                                    content: JSON.stringify([]),
                                },
                            },
                        ],
                    },
                    UpdatedAt: {
                        rich_text: [
                            {
                                text: {
                                    content: now,
                                },
                            },
                        ],
                    },
                };

                // ImageUrlプロパティは省略（存在しない可能性があるため）

                await notion.pages.create({
                    parent: { database_id: databaseId },
                    properties,
                });

                return account;
            } catch (error) {
                console.error("Error linking account:", error);
                throw error; // エラーを再スローして適切にハンドリング
            }
        },

        /**
         * セッション関連のメソッド（簡略化版）
         */
        async createSession(session: {
            sessionToken: string;
            userId: string;
            expires: Date;
        }): Promise<AdapterSession> {
            return {
                sessionToken: session.sessionToken,
                userId: session.userId,
                expires: session.expires,
            };
        },

        async getSessionAndUser(
            sessionToken: string
        ): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
            return null;
        },

        async updateSession(
            session: Partial<AdapterSession> &
                Pick<AdapterSession, "sessionToken">
        ): Promise<AdapterSession | null | undefined> {
            return null;
        },

        async deleteSession(sessionToken: string): Promise<void> {
            return;
        },

        /**
         * メールリンク認証用（未実装）
         */
        async createVerificationToken(
            verificationToken: VerificationToken
        ): Promise<VerificationToken> {
            throw new Error("Email verification not implemented");
        },

        async useVerificationToken(params: {
            identifier: string;
            token: string;
        }): Promise<VerificationToken | null> {
            throw new Error("Email verification not implemented");
        },
    };
}
