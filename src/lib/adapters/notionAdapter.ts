import { Client } from "@notionhq/client";

import type {
    CreatePageResponse,
    PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import type { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";

// Notion APIクライアントの初期化
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
const databaseId = process.env.NOTION_DATABASE_LOGIN!;

type NotionUserData = {
    name: string;
    email?: string;
    provider?: string;
    providerAccountId?: string;
    updatedAt?: string;
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

            return {
                id: getProviderAccountId() || page.id,
                name: getName(),
                email: getEmail(),
                image: null,
                emailVerified: null,
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

                const response = (await notion.pages.create({
                    parent: { database_id: databaseId },
                    properties: {
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
                                        content: "",
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
                    },
                })) as CreatePageResponse;

                return {
                    id: response.id,
                    name: user.name || "Unknown User",
                    email: user.email || "",
                    image: user.image || null,
                    emailVerified: user.emailVerified || null,
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
                // 簡略化のため、既存ユーザー情報を返すだけ
                const existingUser = await this.getUserByEmail!(user.email!);

                if (!existingUser) {
                    throw new Error("User not found for update");
                }

                return {
                    id: existingUser.id,
                    name: user.name || existingUser.name,
                    email: user.email || existingUser.email,
                    image: user.image || existingUser.image,
                    emailVerified:
                        user.emailVerified || existingUser.emailVerified,
                };
            } catch (error) {
                console.error("Error updating user:", error);
                throw error;
            }
        },

        /**
         * アカウント情報のリンク（OAuth プロバイダ情報を記録）
         */
        async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
            try {
                const now = new Date().toISOString();

                await notion.pages.create({
                    parent: { database_id: databaseId },
                    properties: {
                        Name: {
                            title: [
                                {
                                    text: {
                                        content: "",
                                    },
                                },
                            ],
                        },
                        Email: {
                            email: "",
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
                        UpdatedAt: {
                            rich_text: [
                                {
                                    text: {
                                        content: now,
                                    },
                                },
                            ],
                        },
                    },
                });

                return account;
            } catch (error) {
                console.error("Error linking account:", error);
                return account;
            }
        },

        /**
         * セッション関連のメソッド（簡略化版）
         */
        async createSession({ sessionToken, userId, expires }) {
            return { sessionToken, userId, expires };
        },

        async getSessionAndUser(sessionToken) {
            return null;
        },

        async updateSession({ sessionToken, expires }) {
            return null;
        },

        async deleteSession(sessionToken) {
            return;
        },

        /**
         * メールリンク認証用（未実装）
         */
        async createVerificationToken() {
            throw new Error("Email verification not implemented");
        },

        async useVerificationToken() {
            throw new Error("Email verification not implemented");
        },
    };
}
