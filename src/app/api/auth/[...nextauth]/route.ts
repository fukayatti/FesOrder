import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import NotionAdapter from "../../../../lib/adapters/notionAdapter";

export const authOptions: NextAuthOptions = {
    // 認証プロバイダの設定
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
    ],

    // JWT戦略を使用（セッションをDBではなくJWTに保存）
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30日間
    },

    // カスタムNotionアダプターを使用
    adapter: NotionAdapter(),

    // コールバック設定
    callbacks: {
        async jwt({ token, user, account }) {
            // 初回ログイン時にユーザー情報をトークンに保存
            if (user) {
                token.userId = user.id;
                token.email = user.email;
                token.name = user.name;

                // Notionアダプターからカスタムプロパティを取得
                token.role = (user as any).role;
                token.circle = (user as any).circle;
                token.permissions = (user as any).permissions;
            }

            // アカウント情報もトークンに保存
            if (account) {
                token.provider = account.provider;
                token.providerAccountId = account.providerAccountId;
            }

            // 既存のトークンがある場合、Notionから最新の情報を取得
            if (token.email && !user) {
                try {
                    const adapter = NotionAdapter();
                    if (adapter.getUserByEmail) {
                        const latestUser = await adapter.getUserByEmail(
                            token.email as string
                        );
                        if (latestUser) {
                            const latestRole = (latestUser as any).role;
                            const latestCircle = (latestUser as any).circle;
                            const latestPermissions = (latestUser as any)
                                .permissions;

                            // ロール、サークル、権限情報が更新されている場合のみトークンを更新
                            if (latestRole && latestRole !== token.role) {
                                token.role = latestRole;
                                console.log(
                                    "Updated role in token:",
                                    latestRole
                                );
                            }
                            if (latestCircle && latestCircle !== token.circle) {
                                token.circle = latestCircle;
                                console.log(
                                    "Updated circle in token:",
                                    latestCircle
                                );
                            }
                            if (
                                latestPermissions &&
                                JSON.stringify(latestPermissions) !==
                                    JSON.stringify(token.permissions)
                            ) {
                                token.permissions = latestPermissions;
                                console.log(
                                    "Updated permissions in token:",
                                    latestPermissions
                                );
                            }
                            if (
                                latestUser.name &&
                                latestUser.name !== token.name
                            ) {
                                token.name = latestUser.name;
                                console.log(
                                    "Updated name in token:",
                                    latestUser.name
                                );
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error fetching latest user info:", error);
                }
            }

            return token;
        },

        async session({ session, token }) {
            // JWTトークンからセッション情報を構築
            if (token && session.user) {
                (session.user as any).id = token.userId as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;

                // カスタムプロパティを追加
                (session as any).provider = token.provider;
                (session as any).providerAccountId = token.providerAccountId;
                (session as any).role = token.role;
                (session as any).circle = token.circle;
                (session as any).permissions = token.permissions;

                // セッションのユーザーオブジェクトにも追加
                (session.user as any).role = token.role;
                (session.user as any).circle = token.circle;
                (session.user as any).permissions = token.permissions;
            }

            return session;
        },

        async signIn({ user, account, profile }) {
            // サインイン時の追加処理
            console.log("User signed in:", {
                user: user.email,
                provider: account?.provider,
                providerAccountId: account?.providerAccountId,
            });

            // 初回ログイン時はrole-selectionページにリダイレクト
            if (
                user &&
                account &&
                !(user as any).role &&
                !(user as any).circle
            ) {
                // role-selectionページで設定するまでは未完了状態
                console.log("New user, will redirect to role-selection");
            }

            return true;
        },
    },

    // カスタムページ設定
    pages: {
        signIn: "/login",
        error: "/login", // エラー時もログインページにリダイレクト
    },

    // デバッグモード（開発環境のみ）
    debug: process.env.NODE_ENV === "development",

    // セキュリティ設定
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
