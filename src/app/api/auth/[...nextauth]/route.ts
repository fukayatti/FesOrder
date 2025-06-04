import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import NotionAdapter from "../../../../lib/adapters/notionAdapter";

const handler = NextAuth({
    // 認証プロバイダの設定
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
    ],

    // JWT戦略を使用（セッションをDBではなくJWTに保存）
    session: {
        strategy: "jwt",
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
            }

            // アカウント情報もトークンに保存
            if (account) {
                token.provider = account.provider;
                token.providerAccountId = account.providerAccountId;
            }

            return token;
        },

        async session({ session, token }) {
            // JWTトークンからセッション情報を構築
            if (token && session.user) {
                session.user.id = token.userId as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;

                // カスタムプロパティを追加
                session.provider = token.provider;
                session.providerAccountId = token.providerAccountId;
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
});

export { handler as GET, handler as POST };
